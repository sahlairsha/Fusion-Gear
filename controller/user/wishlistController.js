const Product = require('../../models/productSchema');
const User = require('../../models/userSchema')


const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId).populate('wishlist.product_id'); // Populating product_id

        if (!userId) {
            req.flash("error", "Please login!!!");
            return res.redirect("/login");  // Make sure the redirect is to the login page
        }

        const wishlistItems = user.wishlist.filter(item => item.product_id);

        res.render("wishlist", {
            user,
            wishlistItems, 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addToWhishlist = async (req,res)=> {
    const { productId, variantId } = req.body;

    try {
        const userId = req.session.user; 
        
        if (!productId || !variantId) {
            return res.status(400).json({ message: 'Invalid product or variant ID.' });
        }

        // Find the product with the given productId
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Find the variant inside the product
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found.' });
        }

        // Find the user and add the product to the wishlist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Add the product to the user's wishlist if it's not already there
        const isProductInWishlist = user.wishlist.some(wishlistItem => wishlistItem.product_id.toString() === productId);
        if (isProductInWishlist) {
            return res.status(400).json({ message: 'Product already in wishlist.' });
        }

        user.wishlist.push({ product_id: productId });
        await user.save();

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        res.status(500).json({ message: 'Error adding product to the wishlist.' });
    }
}


const removeFromWishlist = async (req, res) => {
    const { productId } = req.body;

    try {
        const userId = req.session.user;

        if (!productId) {
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Remove the product from the wishlist
        const initialWishlistLength = user.wishlist.length;
        user.wishlist = user.wishlist.filter(
            (wishlistItem) => wishlistItem.product_id.toString() !== productId
        );

        if (user.wishlist.length === initialWishlistLength) {
            return res.status(404).json({ message: 'Product not found in wishlist.' });
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ message: 'An error occurred while removing the product.' });
    }
};



module.exports = {
    getWishlist,
    addToWhishlist,
    removeFromWishlist
}