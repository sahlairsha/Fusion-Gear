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
        // Fetch the user and their saved addresses
        const userId = req.session.user;


        const user = await User.findById(userId).populate('cart.product_id');
        const cartItems = user.cart.filter(item => item.product_id);

        const countItems = cartItems.length;
        req.session.cartCount = countItems;

        const order = await Order.findOne({ user_id: userId, order_status: 'Pending' }).lean();
        const shippingAddress = order?.shippingAddress ? [order.shippingAddress] : [];

        console.log(shippingAddress)

        const updateCartTotal = await calculateCartTotals(userId)
        // Pass addresses to the checkout page
        res.render('checkout', {
            shippingAddress,
            cartCount : req.session.cartCount,
            cartItems,
            ...updateCartTotal
        }
        );
    } catch (error) {
        console.log("Error in Loading checkout page", error);
        res.redirect('/pagenotfound');
    }
}



// Save address for current order as shipping address
const saveAddress = async (req, res) => {
    try {
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;

        // Validate required fields
        if (!recipient_name || !streetAddress || !city || !state || !pincode || !phone || !addressType) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const userId = req.session.user; // Assuming session middleware is used
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        // Construct the address object
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

        req.session.shippingAddress = shippingAddress;

        const currentOrder = await Order.findOneAndUpdate(
            { user_id: userId, order_status: 'Pending' }, 
            { $set: { shippingAddress } },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Shipping address saved successfully.',
            shippingAddress: currentOrder.shippingAddress
        });
    } catch (error) {
        console.error('Error saving shipping address:', error);
        res.status(500).json({ success: false, message: 'Failed to save shipping address.' });
    }
};
const getEditPage = async(req,res)=>{
    try{

        res.render('edit-save-address')

    }catch(error){

        res.redirect('/pagenotfound')
    }
}


const editAddress = async(req,res)=>{

    try {
        const userId = req.session.user // Assuming user info is in the session
        const { recipient_name, streetAddress, city, state, pincode, phone, altPhone, addressType } = req.body;

        const result = await Address.updateOne(
            { user_id: userId, "address._id": req.params.id },
            {
                $set: {
                    "address.$.recipient_name": recipient_name,
                    "address.$.streetAddress": streetAddress,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone,
                    "address.$.altPhone": altPhone,
                    "address.$.addressType": addressType
                }
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
}



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
    getEditPage,
    editAddress,
    getPayment,
    getOrderConfirmation

}