const nodemailer = require('nodemailer')

const env = require('dotenv').config()

const bcrypt = require('bcrypt')

const User = require('../../models/userSchema')



// for loading other endpoints.
const pageNotFound = async(req,res) =>{
    try {
        res.render("page-not-found")
    } catch (error) {
        res.status(500).send("Page is not found!!!")
    }
}




const loadHomePage = async (req, res) => {
    try {
        if (req.session.user) {
            const userData = await User.findById(req.session.user);  // Fetch user details by session ID
            res.render("home", { user: userData });
        } else {
            res.render("home", { user: null });  // Render without user data if not logged in
        }
    } catch (error) {
        console.error("Error loading homepage:", error);
        res.status(500).send("Server Error");
    }
};
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

const signup = async (req, res) => {
    try {
        const { full_name, username, phone, email, password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render("signup", { message: "Passwords do not match" });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            req.flash('error', 'User already exists');
            return res.redirect('/signup');
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        console.log("OTP Send:",otp)
        if (!emailSent) {
            return res.render("signup", { message: "Failed to send OTP. Try again later." });
        }

        req.session.userOtp = { otp, expires: Date.now() + 10 * 60 * 1000 };
        req.session.userData = { full_name, username, phone, email, password };

        res.render("verification-otp");
    } catch (error) {
        console.error("Signup error:", error);
        return res.render("signup", { message: "An error occurred. Please try again." });
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

        if (!req.session.userOtp || Date.now() > req.session.userOtp.expires) {
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (otp !== req.session.userOtp.otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again!" });
        }

        const user = req.session.userData;

        const existingUser = await User.findOne({
            $or: [{ username: user.username }, { email: user.email }, { phone: user.phone }]
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username, email, or phone already exists" });
        }

        const passwordHash = await securePassword(user.password);

        const saveUser = new User({
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            password: passwordHash,
            phone: user.phone
        });

        await saveUser.save();

        req.session.user = saveUser._id; // Save the user ID for further session handling
        req.session.userOtp = null; // Clear OTP only, keep userData intact

        res.json({ success: true, redirectUrl: '/' });
    } catch (error) {
        console.error("Error in verifying OTP", error);
        res.status(500).json({ success: false, message: "An Error Occurred" });
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

        res.redirect('/');
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
            res.redirect('/login');
        });
    } catch (error) {
        console.log("Unexpected error in logout",error);
        res.status(500).send("Internal Server Error")
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
    logout
}