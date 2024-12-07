const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Address = require('../../models/addressSchema')


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

// Helper function to calculate the cart totals
async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    // Calculate cart total
    const cartTotal = cartItems.reduce((total, item) => {
        return total + (item.product_id.salePrice * item.quantity);
    }, 0);

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
                    ...updatedCartTotals
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
