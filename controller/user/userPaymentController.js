const getPayment = async(req,res)=>{

    try{
        res.render("payment")

    }catch(err){
        res.redirect("/pagenotfound")
    }
}


const  orderConfirmation = async(req,res)=>{
    try {
        res.render("order-confirmation")
    } catch (error) {
        res.redirect("/pagenotFound")
    }
}

module.exports = {
    getPayment,
    orderConfirmation
}