const User = require('../models/userSchema')

const pageNotFound = async(req,res) =>{
    try {
        res.render("page-not-found")
    } catch (error) {
        res.status(500).send("Page is not found!!!")
    }
}




const loadHomePage = async(req,res)=>{
try {
    return res.render("home")
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

const loadLogin = async(req,res)=>{
    try {
        return res.render('login')
    } catch (error) {
        console.log("Login is not loading", error.message);
        res.status(500).send('Server Error')
    }
}


const signup = async(req,res)=>{
    const {fullName,username,email,password,phone} = req.body
    try {
        const newUser = new User({fullName,username,email,password,phone})
        await newUser.save()
        return res.redirect('/')
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}




module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    loadLogin,
    signup
}