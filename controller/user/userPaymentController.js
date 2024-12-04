const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');



const getPayment = async(req,res)=>{

    try{
        res.render("payment")

    }catch(err){
        res.redirect("/pagenotfound")
    }
}


const getOrderConfirmation = async(req,res)=>{
    try{

        res.render('order-confirmation')

    }catch(error){
        res.redirect('/pagenotfound')
    }

}

module.exports = {
    getPayment,
    getOrderConfirmation
}