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

        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        if (cartItems.length === 0) {
            req.flash('error', "Cart is empty! Please add a product.");
            return res.redirect('/cart');
        }

        // Fetch all orders and populate shipping addresses
        const orders = await Order.find({ user_id: userId }).populate('shippingAddress.address_id');

        const shippingAddresses = orders.shippingAddress.filter((order => order.address_id))


        const updateCartTotal = await calculateCartTotals(userId);

        res.render('checkout', {
            shippingAddresses,
            cartCount: cartItems.length,
            cartItems,
            ...updateCartTotal,
        });
    } catch (error) {
        console.error("Error in Loading checkout page", error);
        res.redirect('/pagenotfound');
    }
};


const saveAddress = async (req, res) => {
    try {
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;
        const userId = req.session.user;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        // Save the address in the Address model
        const newAddress = new Address({
            user_id: userId,
            recipient_name,
            streetAddress,
            city,
            state,
            pincode,
            phone,
            altPhone,
            addressType,
        });
        const savedAddress = await newAddress.save();

        // Update the current order with the new address reference
        await Order.findOneAndUpdate(
            { user_id: userId, order_status: 'Pending' },
            { $push: { shippingAddress: savedAddress._id } },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Shipping address saved successfully.',
            address: savedAddress,
        });
    } catch (error) {
        console.error('Error saving shipping address:', error);
        res.status(500).json({ success: false, message: 'Failed to save shipping address.' });
    }
};



const getAddress = async (req, res) => {
    try {
        const address = await Order.findOne(
            { 'shippingAddress._id': req.params.id },
            { 'shippingAddress.$': 1 } 
        );

        console.log('Fetching address for ID:', req.params.id);

        if (!address || !address.shippingAddress || address.shippingAddress.length === 0) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json(address.shippingAddress[0]);
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

    if (!selectedAddressId) {
        return res.redirect('/checkout');
    }

    const selectedAddress = await Order.findById(selectedAddressId);
    res.render('payment', { selectedAddress });
}


const confirmOrder = async (req, res) => {
    try {
        const userId = req.session.user; 
        const { payment_method } = req.body;

        if (!payment_method) {
            return res.status(400).json({ success: false, message: 'Payment method is required.' });
        }

        // Fetch the user's cart
        const user = await User.findById(userId).populate('cart.product_id');

        if (!user || user.cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        const cartItems = user.cart.filter(item => item.product_id);

        const updateCartTotal = await calculateCartTotals(userId);

        // Check if there's an existing "Pending" order
        let order = await Order.findOne({ user_id: userId, order_status: 'Pending' });

        const shippingAddress = req.session.shippingAddress || user.shippingAddress;

        if (order) {
            // Update the existing pending order
            order.products_id = cartItems;
            order.total_price = updateCartTotal.cartTotal;
            order.payment_method = payment_method;
            order.payment_status = payment_method === 'COD' ? 'Completed' : 'Pending';
            order.order_status = payment_method === 'COD' ? 'Shipped' : 'Pending';
            order.shippingAddress = shippingAddress || [];
        } else {
            order = new Order({
                user_id: userId,
                products_id: cartItems,
                total_price: updateCartTotal.cartTotal,
                payment_method,
                payment_status: payment_method === 'COD' ? 'Completed' : 'Pending',
                order_status: payment_method === 'COD' ? 'Shipped' : 'Pending',
                shippingAddress: shippingAddress || [],
            });
        }

        await order.save();

        // Clear the user's cart after the order is created/updated
        user.cart = [];
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Order confirmed successfully.',
            order,
        });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm order.' });
    }
};





const getOrderConfirmation = async(req,res,next)=>{
    try{
        const userId = req.session.user;
        const orders = await Order.find({ user_id: userId })
            .populate('products_id')
            .exec();

        res.render('order-confirmation',{orders})

    }catch(error){
        res.redirect('/pagenotfound')
    }

}


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