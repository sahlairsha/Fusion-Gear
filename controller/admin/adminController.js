
const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')


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
                return res.redirect('/admin/dashboard',{user : req.body})
            }else{
                return res.redirect('/admin',{message : "User is not existed"})
            }
        }else{
            return res.redirect('/admin')
        }
    } catch (error) {
        console.log("Admin Login Error",error)
        return res.redirect("/pageerror")
    }
}

const loadDashboard = async(req,res)=>{
    try {
        if(req.session.admin){
            res.render("dashboard")
        }
    } catch (error) {
        res.redirect('/pageerror')
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard
}


