const getCart = async(req,res)=>{
    try {
        res.render('cart')
    } catch (error) {
        console.log("Error in loading cart page",error);
        res.redirect('/pagenotfound')
    }
}

module.exports = { getCart }