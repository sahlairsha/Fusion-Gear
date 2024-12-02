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

const applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user;

    try {
        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        const totalAmount = cartItems.reduce((total, item) => {
            return total + (item.product_id.salePrice * item.quantity);
        }, 0);

        let discount = 0, grossAmount = totalAmount, shippingCharges = 5, netAmount = totalAmount + shippingCharges, couponMessage = '';

        // Check if the coupon exists and is valid
        const coupon = coupons.find((c) => c.code === couponCode);
        if (coupon) {
            discount = (totalAmount * coupon.discountValue) / 100;
            grossAmount -= discount;
            if (grossAmount > 100) {
                shippingCharges = 0;  // Free shipping if total > 100
            }
            netAmount = grossAmount + shippingCharges;
            couponMessage = `Coupon applied: ${coupon.code}`;
        }else {
            return res.status(400).json({ success: false, message: 'Invalid coupon code' });
        }

        // Respond with updated cart data
        res.json({
            cartTotal: totalAmount.toFixed(2),
            discount: discount.toFixed(2),
            shippingCharges: shippingCharges.toFixed(2),
            netAmount: netAmount.toFixed(2),
            couponMessage
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
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

    // Assuming no discount logic for now
    const discount = 0;

    // Calculate shipping charges based on cart total
    const shippingCharges = cartTotal > 500 ? 0 : 5;

    // Calculate net amount (cart total + shipping charges)
    const netAmount = cartTotal + shippingCharges;

    // Return the calculated values
    return {
        cartTotal: cartTotal.toFixed(2),
        discount: discount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        couponMessage: '' // You can add coupon message logic if needed
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
                    ...updatedCartTotals // Spread the updated totals in the response
                });
            } else {
                res.status(404).json({ success: false, message: 'Product not found in cart' });
            }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
    }
};


const updateCartQuantity = async (req, res) => {
    const userId = req.session.user; // Assuming you store user in session
    const { productId } = req.params;
    const { quantity } = req.body;

    try {
        const user = await User.findById(userId);
        const productIndex = user.cart.findIndex(item => item.product_id.toString() === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        user.cart[productIndex].quantity = quantity;
        await user.save();

        const updatedCartTotals = await calculateCartTotals(userId);
        res.json(updatedCartTotals);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update cart quantity' });
    }
};


module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    applyCoupon,
    updateCartQuantity
};
