
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



const loadLogin = async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }
        res.render("admin-login",{message : null})
    } catch (error) {
        console.error("Error in loading login page",error)
        res.status(500).send("Server Error")
    }
}

const login = async(req,res)=>{
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({isAdmin: true,email});
        if(admin){
            const passwordMatch = bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect('/admin/dashboard')
            }else{
                return res.redirect('/admin/login',{message : "User is not existed"})
            }
        }else{
            return res.redirect('/admin/login')
        }
    } catch (error) {
        console.log("Admin Login Error",error)
        return res.redirect("/pageerror")
    }
}

const loadDashboard = async(req,res)=>{
    try {
        if(req.session.admin){
           return res.render("dashboard")
        }
    } catch (error) {
        res.redirect('/pageerror')
    }
}


const logout = async(req,res)=>{
    try {
        req.session.destroy(err =>{
            if(err){
                console.log("Error in destroying session",err)
                return res.redirect('/pageerror')
            }

            res.redirect('/admin/login')
        })
    } catch (error) {
        console.log("Unexpected error in logout",error);
        res.status(500).send("Internal Server Error")
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout
}


