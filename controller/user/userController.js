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




const loadHomePage = async(req,res)=>{
try {
    const user = req.session.user;
    if(user){
        const userData = await User.findOne({_id : user._id})
        res.render("home",{user : userData})
    }else{
        return res.render("home")
    }
} catch (error) {
    console.log("Homepage is not found")
    res.status(500).send("Server Error")
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
    console.log(Math.floor(100000 + Math.random() * 900000).toString())
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
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_PASSWORD
            }

        });
        console.log(process.env.EMAIL_USER)
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account With OTP",
            text: `Your OTP is: ${otp}`,
            html: `<b>Your OTP is: ${otp}</b>`
        });

        console.log("Email sent: ", info);
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
            return res.render("signup", { message: "Passwords do not match"});
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "User Already Exists"});
        }

        const otp = generateOtp();
        const emailSend = await sendVerificationEmail(email, otp);
        console.log("OTP sent", otp);
        if (!emailSend) {
            return res.json("Email-Error");
        }

        req.session.userOtp = { otp, expires: Date.now() + 10 * 60 * 1000 };
        req.session.userData = { full_name, username, phone, email, password };

        res.render("verification-otp");
    } catch (error) {
        console.error("signup error", error);
        return res.render("signup", { message: "An error occurred. Please try again."});
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

        const existingUser = await User.findOne({ $or: [{ username: user.username }, { email: user.email }, { phone: user.phone }] });
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

        // Clear session data after successful save
        req.session.user = saveUser._id;
        req.session.userData = null;
        req.session.userOtp = null;

        res.json({ success: true, redirectUrl: '/' });
    } catch (error) {
        console.error("Error in verifying OTP", error);
        res.status(500).json({ success: false, message: "An Error Occurred" });
    }
    console.log("Current session data:", req.session);
};


const resendOtp = async (req, res) => {
    try {
        const {email} = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOtp();
        req.session.userOtp = { otp, expires: Date.now() + 10 * 60 * 1000 };

        console.log(req.session.userOtp)
        const emailSend = await sendVerificationEmail(email, otp);

        if (emailSend) {
            console.log("Resend OTP:", otp);
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } else {
            res.status(500).json({ success: false, message: "Error occurred while resending OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error in resend OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error! Please try again." });
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
            return res.render('login', { message: "User is not found" });
        }
        if (findUser.isBlocked) {
            return res.render('login', { message: "This user is blocked by admin" });
        }

        // Check for password match
        const passwordMatch =  bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Invalid Password! Please Try again" });
        }

        // Save user ID in session
        req.session.user = findUser._id;

        // Redirect to home page
        res.redirect('/');
    } catch (error) {
        console.error("Login Error", error);
        res.render("login", { message: "Login Failed, Please try again later" });
    }
};


const logout = async (req, res) => {
    try {
        req.logout((err) => {
            if (err) {
                console.log("Error logging out:", err.message);
                return res.redirect('/pagenotfound');
            }
            req.session.regenerate((err) => { // Regenerate session to clear all data
                if (err) {
                    console.log("Error regenerating session:", err.message);
                    return res.redirect('/pagenotfound');
                }
                res.clearCookie('connect.sid');
                res.redirect('/login');
            });
        });
    } catch (error) {
        console.log("Logout error", error);
        res.redirect('/pagenotfound');
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