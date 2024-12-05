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
    const { quantity } = req.body;
    const userId = req.session.user;

    try {
       
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

        // Find the cart item and update its quantity
        const user = await User.findOneAndUpdate(
            { _id: userId, "cart.product_id": productId },
            { $set: { "cart.$.quantity": quantity } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        // Recalculate cart totals after updating quantity
        const updatedCartTotals = await calculateCartTotals(userId);

        
        res.json(updatedCartTotals);
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Failed to update product quantity' });
    }
};

const getCheckout = async (req, res) => {
    try {
        // Fetch the user and their saved addresses
        const userId = req.session.user;
        const addresses = await Address.find({ user_id: userId });

        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        const countItems = cartItems.length;
        req.session.cartCount = countItems;


        const updateCartTotal = await calculateCartTotals(userId)
        // Pass addresses to the checkout page
        res.render('checkout', { 
            addresses: addresses[0]?.address || [],
            cartCount : req.session.cartCount,
            ...updateCartTotal
        }
        );
    } catch (error) {
        console.log("Error in Loading checkout page", error);
        res.redirect('/pagenotfound');
    }
}



const saveAddress = async (req, res) => {
    try {
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;

        // Validate the required fields (optional but recommended)
        if (!recipient_name || !streetAddress || !city || !state || !pincode || !phone || !addressType) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        // Construct the new address object
        const newAddress = {
            recipient_name,
            streetAddress,
            city,
            state,
            pincode,
            phone,
            altPhone,
            addressType
        };

        // Get the user ID from the authenticated session or token
        const userId = req.user.id;  // Assuming `req.user.id` contains the authenticated user's ID

        // Check if the user already has an address document
        let address = await Address.findOne({ user_id: userId });

        // If no address document exists, create a new one
        if (!address) {
            address = new Address({ user_id: userId, address: [] });
        }

        // Push the new address into the address array
        address.address.push(newAddress);

        // Save the address document
        await address.save();

        // Return a success response
        res.json({ success: true, message: 'Address saved successfully' });

    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ success: false, message: 'Failed to save address' });
    }
};

module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCheckout,
    saveAddress
};
