const nodemailer = require('nodemailer')
const crypto = require('crypto');
const env = require('dotenv').config()

const bcrypt = require('bcrypt')

const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')



// for loading other endpoints.
const pageNotFound = async(req,res) =>{
    try {
        res.render("page-not-found")
    } catch (error) {
        res.status(500).send("Page is not found!!!")
    }
}




const loadHomePage = async (req, res) => {
    try{
        
    const productData = await Product.find().populate('category')
    .sort({createdAt: -1})
    .limit(6)


    if (!req.session.user) {
        
        res.render('home', { user: null, products: productData });
    } else {
        
        const userData = await User.findById(req.session.user).populate('cart.product_id');

         req.session.cartCount = userData.cart.length;
         const count = req.session.cartCount
        
        res.render('home', { user: userData, products: productData ,count});
    }
}catch(error){
    console.log("Home page is not loading", error.message);
    res.redirect('/pagenotfound')
}
}


const loadSignup = async(req,res)=>{
    try {
        return res.render('signup')
    } catch (error) {
        console.log("Signup is not loading", error.message);
        res.status(500).send('Server Error')
    }
}


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// Securely generate a reset token
const generateResetToken = () => crypto.randomBytes(32).toString('hex');
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account With OTP",
            text: `Your OTP is: ${otp}`,
            html: `<b>Your OTP is: ${otp}</b>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

const validateAvatar = async (avatarUrl) => {
    try {
      const response = await fetch(avatarUrl);
      if (!response.ok) {
        throw new Error(`Avatar URL is invalid: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("Error validating avatar URL:", error);
      return false;
    }
  };

  const generateReferralCode = (userId) => {
    return crypto.createHash('sha256').update(userId.toString()).digest('hex').slice(0, 8);
};

const handleReferral = async (newUser, referralCode) => {
    if (referralCode) {
        const referrer = await User.findOne({ referralCode });

        if (referrer) {
            // Reward the referrer
            referrer.wallet += 100;  
            referrer.redeemedUser.push(newUser._id);  
            referrer.transactions.push({
                type: 'Referral_bonus',
                amount: 100,
                description: `Referral bonus for inviting ${newUser.username}`,
                date: new Date(),
            });

            
            await referrer.save();

            // Optionally reward the referred user (new user)
            newUser.wallet += 50;
            newUser.transactions.push({
                type: 'Referral_bonus',
                amount: 50,
                description: `Referral bonus from ${referrer.username}`,
                date: new Date(),
            });

            // Save the new user after updating the wallet and transactions
            await newUser.save();
        } else {
            console.error("Invalid referral code");
        }
    }
};




const signup = async (req, res) => {
    try {
        const { full_name, username, phone, email, password, confirm_password, referralCode } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User already exists');
            return res.redirect('/signup');
        }

        // Validate passwords
        if (password !== confirm_password) {
            return res.render("signup", { message: "Passwords do not match" });
        }

        // Generate avatar URL
        const avatarUrl = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex')}?d=robohash&r=g&s=200`;

        // Validate avatar
        const isAvatarValid = await validateAvatar(avatarUrl);
        if (!isAvatarValid) {
            return res.render("signup", { message: "Invalid avatar. Please try again." });
        }

        // Handle referrals
        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode });
            if (referrer) {
                req.session.referrer = referrer;
            } else {
                req.flash('error', 'Invalid referral code');
                return res.redirect('/signup');
            }
        }

        // Generate and send OTP
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.render("signup", { message: "Failed to send OTP. Try again later." });
        }

        console.log("Verification Otp:" , otp)
        // Store OTP and user data in the session
        req.session.userOtp = { otp, expires: Date.now() + 10 * 60 * 1000 }; // OTP expires in 10 minutes
        req.session.userData = { full_name, username, phone, email, password, profile_pic: avatarUrl };
       
        res.render("verification-otp");
    } catch (error) {
        console.error("Signup error:", error);
        res.render("signup", { message: "An error occurred. Please try again." });
    }
};




const securePassword = async(password) => {
    try {
       const passwordHash = await bcrypt.hash(password,10)
       return passwordHash
    } catch (error) {
        console.error('There is a problem in hashing password',error)
        return res.status(500).send('There is a problem in hashing password')
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        // Check OTP expiration
        if (!req.session.userOtp || Date.now() > req.session.userOtp.expires) {
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        // Verify OTP
        if (otp !== req.session.userOtp.otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again!" });
        }

        // Create user
        const user = req.session.userData;
        const hashedPassword = await securePassword(user.password);

        const newUser = new User({
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            password: hashedPassword,
            phone: user.phone,
            profile_pic: user.profile_pic,
        });

        // Handle referral rewards
        if (req.session.referrer) {
            await handleReferral(newUser, req.session.referrer.referralCode);
        }

        // Generate referral code
        newUser.referralCode = generateReferralCode(newUser._id);
        await newUser.save();

        // Clear session data
        req.session.userOtp = null;
        req.session.user = newUser._id;

        

        res.json({ success: true, redirectUrl: '/' });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOtp();
        req.session.userOtp = { otp, expires: Date.now() + 10 * 60 * 1000 };

        const emailSent = await sendVerificationEmail(email, otp);
        console.log("Resend OTP:",otp)

        if (emailSent) {
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. Try again." });
        }
    } catch (error) {
        console.error("Error in resend OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error. Try again." });
    }
};


const loadLogin = async(req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.log("Login is not loading", error.message);
        res.redirect('/pagenotfound')
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const findUser = await User.findOne({ isAdmin: false, email });

        if (!findUser) {
            req.flash("error", "User not found. Please sign up")
            return res.redirect('login');
        }
        if (findUser.isBlocked) {
            req.flash("error", "User is blocked by admin")
            return res.redirect('/login');
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            req.flash("error", "Invalid Password! Try again.")
            return res.redirect("/login");
        }

        req.session.user = findUser._id;

        if (req.session.user) {
            return res.redirect('/');
        }

    } catch (error) {
        console.error("Login Error", error);
        req.flash("error", "Login failed. Try again later.")
        res.redirect("/login");
    }
};


const logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Error destroying session:', err);
                return res.redirect('/');
            }
            res.redirect('/');
        });
    } catch (error) {
        console.log("Unexpected error in logout",error);
        res.status(500).send("Internal Server Error")
    }
};






// Hash the token for secure storage
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Send reset email
const sendResetEmail = async (email, resetLink) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `<p>You requested a password reset. Click the link below to reset your password:</p>
               <a href="${resetLink}">Reset Password</a>
               <p>If you did not request this, please ignore this email.</p>`
    };

    return transporter.sendMail(mailOptions);
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash('error', 'No account with that email found.');
            return res.redirect('/forgot-password');
        }

        const resetToken = generateResetToken();
        user.resetToken = hashToken(resetToken);
        user.resetTokenExpiry = Date.now() + 3600000;
        await user.save();

        const resetLink = `https://www.fusion-gear.shop/reset-password?token=${resetToken}`;
        await sendResetEmail(email, resetLink);

        req.flash('success', 'Password reset link sent to your email.');
        res.redirect('/forgot-password');
    } catch (error) {
        console.error('Error in forgot password:', error);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/forgot-password');
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/reset-password?token=${token}`);
        }

        const hashedToken = hashToken(token);
        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgot-password');
        }

        // Await the securePassword function to get the hashed password as a string
        const hashedPassword = await securePassword(newPassword);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        req.flash('success', 'Password reset successful. Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error resetting password:', error);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/forgot-password');
    }
};






module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    loadLogin,
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword
   
}