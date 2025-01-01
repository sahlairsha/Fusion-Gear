
const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')



const pageerror = async(req,res)=>{
    try {
        res.render('pageerror')
    } catch (error) {
        console.log("Page Error is not loading");
        res.status(500).send("Internal Server Error")
    }
}



const getProfile = async(req,res) =>{

        if(req.session.admin){
            res.render('admin-profile', { user : req.session.admin })
        }else{
            console.log("Some Error Occure to load the profile page")
            res.redirect('/admin/login')
        }
}


const loadLogin = async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin_profile")
        }
            res.render("admin-login",{message : req.flash('error')})
    } catch (error) {
        console.error("Error in loading login page",error)
        res.redirect("/pageerror")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const findAdmin = await User.findOne({ isAdmin: true, email });

        if (!findAdmin) {
            req.flash("error", "Admin not found. Please try again ")
            return res.redirect('/admin/login');
        }

        const passwordMatch = await bcrypt.compare(password, findAdmin.password);
        if (!passwordMatch) {
            req.flash("error", "Invalid Password! Try again.")
            return res.redirect("/admin/login");
        }

        req.session.admin = findAdmin._id;
        console.log(req.session.admin)

        res.redirect('/admin_profile');
    } catch (error) {
        console.error("Login Error", error);
        req.flash("error", "Login failed. Try again later.")
        res.redirect("/admin/login");
    }
};

const loadDashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            const adminData = await User.findById(req.session.admin)
            return res.render("dashboard",{admin:adminData})
        } else {
            return res.render("dashboard",{admin:null})
        }
    } catch (error) {
        console.log("Error loading dashboard", error);
        res.redirect('/pageerror');
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Error destroying session:', err);
            }
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.log("Unexpected error in logout",error);
        res.status(500).send("Internal Server Error")
    }
};




module.exports = {
    loadLogin,
    getProfile,
    login,
    loadDashboard,
    pageerror,
    logout,
}


