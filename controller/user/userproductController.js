
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const loadProducts = async(req, res) => {
    try {
        if (req.session.user) {
            const userData = await User.findById(req.session.user);
            const productData = await Product.find()
            res.render("userproducts", { user: userData , products : productData});
        } else {
            res.render("userproducts", { user: null });
        }
    } catch (error) {
        console.error("Error loading homepage:", error);
        res.status(500).send("Server Error");
    }
}





module.exports = {loadProducts}