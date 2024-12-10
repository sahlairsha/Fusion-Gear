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
        // Fetch the user and their cart
        const userId = req.session.user;

        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        const countItems = cartItems.length;
        req.session.cartCount = countItems;

        // Fetch all orders for the user and only select the shippingAddress field
        const orders = await Order.find({ user_id: userId }).select('shippingAddress');

        // Extract all the shipping addresses
        const shippingAddresses = orders.flatMap(order => order.shippingAddress);

        console.log(shippingAddresses)

        const updateCartTotal = await calculateCartTotals(userId);

        // Render the checkout page with all necessary data
        res.render('checkout', {
            shippingAddresses,
            cartCount: req.session.cartCount,
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

        // Validate required fields
        if (!recipient_name || !streetAddress || !city || !state || !pincode || !phone || !addressType) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const userId = req.session.user; // Assuming session middleware is used
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const shippingAddress = {
            recipient_name,
            streetAddress,
            city,
            state,
            pincode,
            phone,
            altPhone,
            addressType,
        };

        // Check if the address already exists in the user's shipping addresses
        const user = await User.findById(userId);
        const existingAddress = user.shippingAddress.find(address => 
            address.recipient_name === recipient_name &&
            address.streetAddress === streetAddress &&
            address.city === city &&
            address.state === state &&
            address.pincode === pincode &&
            address.phone === phone &&
            address.altPhone === altPhone &&
            address.addressType === addressType
        );

        if (existingAddress) {
            return res.status(400).json({ success: false, message: 'This address already exists.' });
        }

        // If address does not exist, save the new address
        req.session.shippingAddress = shippingAddress;

        const currentOrder = await Order.findOneAndUpdate(
            { user_id: userId, order_status: 'Pending' }, 
            { $push: { shippingAddress } },
            { new: true, upsert: true }
        );
        res.json({
            success: true,
            message: 'Shipping address saved successfully.',
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
        const userId = req.session.user;
        const addressId = req.params.id;
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;

        const result = await Order.updateOne(
            { user_id: userId, "shippingAddress._id": addressId },
            {
                $set: {
                    "shippingAddress.$.recipient_name": recipient_name,
                    "shippingAddress.$.streetAddress": streetAddress,
                    "shippingAddress.$.city": city,
                    "shippingAddress.$.state": state,
                    "shippingAddress.$.pincode": pincode,
                    "shippingAddress.$.phone": phone,
                    "shippingAddress.$.altPhone": altPhone,
                    "shippingAddress.$.addressType": addressType,
                },
            }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ success: false, message: 'Address not updated' });
        }

        res.json({ success: true, message: 'Address updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



const getPayment = async(req,res)=>{

    try{
        const userId = req.session.user;
        res.render("payment")

    }catch(err){
        res.redirect("/pagenotfound")
    }
}


const getOrderConfirmation = async(req,res)=>{
    try{

        res.render('order-confirmation')

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
    getAddress
}