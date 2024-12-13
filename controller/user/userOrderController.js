const Order = require('../../models/orderSchema');

const Address = require('../../models/addressSchema')

const User = require('../../models/userSchema')


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


const getCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
      const savedAddress = await Address.find({user_id : userId})

        const user = await User.findById(userId).populate('cart.product_id');
        const orderProducts = user.cart.map(item => ({
            product_id: item.product_id._id,
            quantity: item.quantity,
        }));

        if (orderProducts.length === 0) {
            req.flash('error', "Cart is empty! Please add a product.");
            return res.redirect('/cart');
        }


        const updatedCartTotals = await calculateCartTotals(userId)

        res.render('checkout', {
            address: savedAddress,
            cartCount : orderProducts.length,
            ...updatedCartTotals
        });
    } catch (error) {
        console.error("Error loading checkout page:", error);
        req.flash('error', "An error occurred. Please try again.");
        res.redirect('/cart');
    }
};


const saveAddress = async (req, res) => {
    try {
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;
        const userId = req.session.user;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        // Find the user by ID and push the new address to the address array
        const userAddress = await Address.findOne({ user_id: userId });

        if (!userAddress) {
            // If no address record exists for the user, create one
            const newAddress = new Address({
                user_id: userId,
                address: [{
                    recipient_name,
                    streetAddress,
                    city,
                    state,
                    pincode,
                    phone,
                    altPhone,
                    addressType
                }]
            });
            await newAddress.save();
        } else {
            // If address record exists, push the new address to the address array
            userAddress.address.push({
                recipient_name,
                streetAddress,
                city,
                state,
                pincode,
                phone,
                altPhone,
                addressType
            });
            await userAddress.save();
        }

        res.json({
            success: true,
            message: 'Shipping address saved successfully.',
            address: {
                recipient_name,
                streetAddress,
                city,
                state,
                pincode,
                phone,
                altPhone,
                addressType
            },
        });
    } catch (error) {
        console.error('Error saving shipping address:', error);
        res.status(500).json({ success: false, message: 'Failed to save shipping address.' });
    }
};


const getAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        const address = await Address.findById(addressId);

        console.log('Fetching address for ID:', addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json(address);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



const editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            {
                recipient_name,
                streetAddress,
                city,
                state,
                pincode,
                phone,
                altPhone,
                addressType,
            },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: 'Address not found or not updated.' });
        }

        res.json({ success: true, message: 'Address updated successfully.', address: updatedAddress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


const selectAddress = async (req, res) => {
    const { addressId } = req.body;

    if (!addressId) {
        return res.status(400).json({ message: 'Address ID is required.' });
    }

    try {
        const selectedAddress = await Address.findById(addressId);

        if (!selectedAddress) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        req.session.selectedAddress = selectedAddress._id;
        res.json({ message: 'Address selected successfully.', address: selectedAddress });
    } catch (error) {
        console.error('Error selecting address:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


const getPayment = async(req,res)=>{

    const selectedAddressId = req.session.selectedAddress;
    console.log(selectedAddressId);

    if (!selectedAddressId) {
        return res.redirect('/checkout');
    }

    const selectedAddress = await Order.findById(selectedAddressId);
    res.render('payment', { selectedAddress });
}


const confirmOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { address_id, payment_method } = req.body;

        // Fetch user cart items
        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart;

        if (cartItems.length === 0) {
            req.flash('error', "Cart is empty! Please add products.");
            return res.redirect('/cart');
        }

        // Calculate total price
        const totalPrice = cartItems.reduce((total, item) => {
            return total + item.product_id.salePrice * item.quantity;
        }, 0);

        // Create order
        const newOrder = new Order({
            user_id: userId,
            products: cartItems.map(item => ({
                product_id: item.product_id._id,
                quantity: item.quantity
            })),
            total_price: totalPrice,
            payment_method,
            shippingAddress: [{ address_id }] 
        });

        await newOrder.save();

        user.cart = [];
        await user.save();

        req.flash('success', "Order placed successfully!");
        res.redirect('/orders');
    } catch (error) {
        console.error("Error in Placing Order", error);
        req.flash('error', "Failed to place the order. Please try again.");
        res.redirect('/checkout');
    }
};





const getOrderConfirmation = async(req,res)=>{
        try {
            const userId = req.session.user;
    
            // Fetch orders and populate product and address details
            const orders = await Order.find({ user_id: userId })
                .populate('products.product_id')
                .populate('shippingAddress.address_id');
    
            res.render('orders', {
                orders
            });
        } catch (error) {
            console.error("Error in Loading Orders Page", error);
            res.redirect('/pagenotfound');
        }
    };
    




module.exports = {
    getCheckout,
    saveAddress,
    editAddress,
    getPayment,
    getOrderConfirmation,
    getAddress,
    confirmOrder,
    selectAddress
}