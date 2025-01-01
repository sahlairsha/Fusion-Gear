const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Order = require('../../models/orderSchema');
const ProductVariant = require("../../models/productVariantSchema");

async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    console.log("Items in cart : ", cartItems);

    let cartTotal = 0;

    for (const item of cartItems) {
        if (item.product_id) {
            // Fetch the corresponding variant from the ProductVariant collection by product_id
            const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });

            console.log("Product variants:", productVariant);

            if (productVariant && productVariant.variant.length > 0) {
                // Get the first variant (or any logic you want to choose a variant)
                const variant = productVariant.variant[0];  // Picking the first variant as default

                
                const price = variant.salePrice || variant.regularPrice;
                cartTotal += price * item.quantity;
                console.log("Product variant price:", price);
            } else {
                console.log(`No variants found for product ${item.product_id._id}`);
            }
        } else {
            console.log("Item missing product_id:", item);
        }

        console.log("Product Items for search:", item.product_id._id);
    }

    const shippingCharges = cartTotal > 500 ? 0 : 50;
    const netAmount = cartTotal + shippingCharges;

    // Return the updated values
    return {
        cartTotal: cartTotal.toFixed(2),
        discount: '0.00',
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
    };
}





const getCartPage = async (req, res) => {
    const userId = req.session.user;
    try {
        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        if (!userId) {
            req.flash("error", "Please login!!!");
            return res.redirect("/");
        }

        const countItems = cartItems.length;
        req.session.cartCount = countItems;

        // Fetch the variants for each product in the cart
        for (let item of cartItems) {
            try {
                const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });

                if (productVariant && productVariant.variant.length > 0) {
                    // Get the first variant (or select a specific one if needed)
                    const variant = productVariant.variant[0];  // Picking the first variant as default

                    // Add variant data to the cart item
                    item.variant = variant;
                    item.salePrice = variant.salePrice || variant.regularPrice;  // Use salePrice or fallback to regularPrice
                } else {
                    console.log(`No variants found for product ${item.product_id._id}`);
                }
            } catch (variantError) {
                console.error('Error fetching product variant:', variantError);
            }
        }

        // Now calculate the cart totals
        const updatedCartTotals = await calculateCartTotals(userId);

        // Render the cart page with updated cart items and totals
        res.render("cart", {
            user,
            cartItems,
            ...updatedCartTotals,
            couponMessage: "",
            cartCount: req.session.cartCount,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error loading cart page");
    }
};



// Add product to cart
const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user;

        
        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

       
        const user = await User.findOne({ _id: userId });

        
        const existingItem = user.cart.find(item => item.product_id.toString() === productId);

        if (existingItem) {
        
            const newQuantity = existingItem.quantity + 1;
            if (newQuantity > product.quantity) {
                return res.json({
                    success: false,
                    message: `Only ${product.quantity} left in stock. You can add up to ${product.quantity} to the cart.`
                });
            }

            
            await User.updateOne(
                { _id: userId, "cart.product_id": productId },
                { $inc: { "cart.$.quantity": 1 } },
                { new: true }
            );
        } else {
           
            if (product.quantity < 1) {
                return res.json({
                    success: false,
                    message: `Product is out of stock`
                });
            }

            
            await User.findByIdAndUpdate(
                userId,
                { $push: { cart: { product_id: productId, quantity: 1 } } },
                { new: true }
            );
        }

        res.json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
};




const removeFromCart = async (req, res) => {
    const  userId  = req.session.user;
    const { productId } = req.params;
    try {

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { cart: { product_id: productId } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User or product not found in cart' });
        }

              const updatedCartTotals = await calculateCartTotals(userId);
              
              

                res.json({
                    success: true,
                    message: 'Product removed successfully',
                    ...updatedCartTotals,
                   
                });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
    }
};

const updateQuantity = async (req, res) => {

    try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.session.user;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (quantity > product.quantity) {
            return res.json({
                success: false,
                message: `Only ${product.quantity} left in stock.`
            });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, "cart.product_id": productId },
            { $set: { "cart.$.quantity": quantity } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        
        const updatedCartTotals = await calculateCartTotals(userId);

        res.json({
            sucess : true,
            ...updatedCartTotals
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Failed to update product quantity' });
    }
};




module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateQuantity,

};
