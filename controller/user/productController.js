
const Product = require("../../models/productSchema");

const getproducts = async(req,res)=>{
    try {
        const products = await Product.find({});

        const images = [];

        if(req.files && req.files.length > 0){
            for(let i=0;i<req.files.length ; i++){
                images.push(res.files[i].filename)
            }
        }

        res.render("userproducts", {data : products})
    } catch (error) {
        console.log("Error in getting products")
       res.redirect("/pagenotfound")
    }
}


module.exports = {getproducts}