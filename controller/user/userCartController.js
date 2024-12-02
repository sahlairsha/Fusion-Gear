const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Address = require('../../models/addressSchema')

const coupons = [
    {
        code: "DISCOUNT10",
        discountType: "percentage",
        discountValue: 10,
        expiryDate: new Date("2024-12-31"),
        minimumPurchase: 500,
        usageLimit: 100,
        description: "Get 10% off on your purchase of ₹500 or more. Valid until December 31, 2024."
    },
    {
        code: "FLAT50",
        discountType: "fixed",
        discountValue: 50,
        expiryDate: new Date("2024-11-30"),
        minimumPurchase: 1000,
        usageLimit: 50,
        description: "Save ₹50 on your order of ₹1000 or more. Valid until November 30, 2024."
    }
];

const getCartPage = async (req, res) => {
    const userId = req.session.user;
    try {
        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        const addressData = await Address.find({user_id : userId});

        const countItems = cartItems.length;
        req.session.cartCount = countItems;


        const totalAmount = cartItems.reduce((total, item) => {
            return total + (item.product_id.salePrice * item.quantity);
        }, 0);

        const shippingCharges = totalAmount > 500 ? 0 : 5;
        const netAmount = totalAmount + shippingCharges;

        res.render('cart', {
            user,
            cartItems,
            cartTotal: totalAmount.toFixed(2),
            discount: '0.00',
            shippingCharges: shippingCharges.toFixed(2),
            netAmount: netAmount.toFixed(2),
            couponMessage: '',
            address :  addressData,
            cartCount : req.session.cartCount
        });

    } catch (error) {
        res.status(500).send('Error loading cart page');
    }
};




// Add product to cart
const addToCart = async(req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user;

          const user = await User.findOneAndUpdate(
            { _id: userId, "cart.product_id": productId }, 
            { $inc: { "cart.$.quantity": 1 } }, 
            { new: true } 
        );

        if (!user) {
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

// Helper function to calculate the cart totals
async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    // Calculate cart total
    const cartTotal = cartItems.reduce((total, item) => {
        return total + (item.product_id.salePrice * item.quantity);
    }, 0);

    const shippingCharges = cartTotal > 500 ? 0 : 5;
    const netAmount = cartTotal + shippingCharges;

    // Return the updated values
    return {
        cartTotal: cartTotal.toFixed(2),
        discount: '0.00',
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
    };
}


// Remove product from cart
const removeFromCart = async (req, res) => {
    const  userId  = req.session.user; // Get the user from the session or token
    const { productId } = req.params; // Get product ID from the URL
    try {

      const updateData =  await User.updateOne(
            { _id: userId },
            { $pull: { cart: { product_id: productId } } }
        );

              // Check if the update was successful
              if (updateData.modifiedCount > 0) {
                // Recalculate the cart totals
                const updatedCartTotals = await calculateCartTotals(userId);
    
                // Send both success message and updated totals
                res.json({
                    success: true,
                    message: 'Product removed successfully',
                    ...updatedCartTotals
                });
            } else {
                res.status(404).json({ success: false, message: 'Product not found in cart' });
            }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
    }
};


const updateQuantity = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body; // Get new quantity from request
    const userId = req.session.user;

    try {
        // Find the cart item and update its quantity
        const user = await User.findOneAndUpdate(
            { _id: userId, "cart.product_id": productId },
            { $set: { "cart.$.quantity": quantity } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        // Recalculate cart totals
        const updatedCartTotals = await calculateCartTotals(userId);

        // Send back updated totals
        res.json(updatedCartTotals);
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Failed to update product quantity' });
    }
};



const getCheckout = async(req,res)=>{
    try {
        res.render('checkout')
    } catch (error) {
        console.log("Error in Loading checkout page",error);
        res.redirect('/pagenotfound')
    }
}


module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCheckout
};
