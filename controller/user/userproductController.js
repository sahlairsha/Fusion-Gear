
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema")

const loadProducts = async(req, res) => {
    try {
        if (req.session.user) {
            const userData = await User.findById(req.session.user);
            const productData = await Product.find()
            res.render("userproducts", { user: userData , products : productData});
              
        } else {
            res.render("userproducts", { user: null , products: productData});
        }
    } catch (error) {
        console.error("Error loading productpage:", error);
        res.status(500).send("Server Error");
    }
}

const loadProductsDetails = async (req, res) => {
    try {
        const {id} = req.query

        if (!id) {
            console.log("Product ID is missing");
            return res.redirect("/pagenotfound");
        }

        const productData = await Product.findById(id);
        if (!productData) {
            console.log("Product not found with ID:", id);
            req.flash("error","Product Not Found ")
            return res.redirect("/product/view");
        }

        const category = await Category.findOne({ _id: productData.category})
        

        const userData = req.session.user ? await User.findById(req.session.user) : null;
        res.render("productlist", { user: userData, product: productData, category : category});
    } catch (error) {
        console.error("Error loading product details page:", error);
        res.redirect("/pagenotfound");
    }
};





module.exports = {
    loadProducts,
    loadProductsDetails
}