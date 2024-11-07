const User = require('../models/userSchema');


const userAuth = (req,res,next)=>{
    User.findOne({isAdmin : false , isBlocked : false})
    .then(data =>{
        if(data){
            next();
        }else{
            res.redirect('/login')
        }
    }).catch(err=>{
        console.log("Error in admin auth middleware");
        res.status(500).send("Internal Server Error")
    })
}


const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin : true})
    .then(data =>{
        if(data){
            next();
        }else{
            res.redirect('/admin/login')
        }
    }).catch(err=>{
        console.log("Error in admin auth middleware");
        res.status(500).send("Internal Server Error")
    })
}

module.exports = {
    userAuth,
    adminAuth
}