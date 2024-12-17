const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')

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
        // Fetch the parent address document
        const addressDoc = await Address.findOne({ "address._id": addressId });


        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        // Find the address inside the array based on the addressId
        const selectedAddress = addressDoc.address.find(addr => addr._id.toString() === addressId);

        if (!selectedAddress) {
            return res.status(404).json({ message: 'Address not found in the address list.' });
        }

        // Store the selected address ID in session
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

    res.render('payment');
}


function getRandomDeliveryDate() {
    // Get the current date
    const currentDate = new Date();
  
    // Generate a random number of days between 1 and 4
    const randomDays = Math.floor(Math.random() * 4) + 1;
  
    // Add the random number of days to the current date
    currentDate.setDate(currentDate.getDate() + randomDays);
  
    // Format the delivery date (optional)
    const deliveryDate = currentDate.toLocaleString();
  
    return deliveryDate;
  }



  const confirmOrder = async (req, res) => {
    const userId = req.session.user;
    const addressId = req.session.selectedAddress;
    const { payment_method } = req.body;

    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart



    const addressDoc = await Address.findOne({ user_id: userId });
    const selectedIndex = addressDoc.address.findIndex(addr => addr._id.equals(addressId));

    if (selectedIndex === -1) {
        return res.status(404).json({ message: "Address not found" });
    }



    const totalPrice = cartItems.reduce((total, item) => {
        return total + item.product_id.salePrice * item.quantity;
    }, 0);

    const  deliveryDate = getRandomDeliveryDate()

    const newOrder = new Order({
        user_id: userId,
        products: cartItems.map(item => ({
            product_id: item.product_id._id,
            quantity: item.quantity,
        })),
        total_price: totalPrice,
        payment_method,
        payment_status: 'Completed',
        shippingAddress: {
            addressDocId: addressDoc._id,
            addressIndex: selectedIndex,
        },
        delivery_date :  deliveryDate 
    });

    await newOrder.save();

    for (const item of cartItems) {
        await Product.findByIdAndUpdate(
            item.product_id._id,
            { $inc: { quantity: -item.quantity } },
            { new: true }
        );
    }

 
    user.cart = [];
    await user.save();

 

    res.json({ message: 'Order confirmed successfully.' });
};





const getOrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user;
        const showOverlay = req.query.status === 'confirmed';

        const orders = await Order.find({ user_id: userId })
            .populate('products.product_id')
            .exec();


        res.render('order-confirmation', {
            orders,
            activePage: 'orders',
            disablePreloader: true,
            showOverlay,
        });
    } catch (error) {
        console.error("Error in Loading Orders Page", error);
        res.redirect('/pagenotfound');
    }
};

const orderDetails = async (req, res) => {
    const orderId = req.params.id;

    const orders = await Order.findById(orderId)
        .populate({
            path: 'products.product_id', 
            select: 'productName color size productImage salePrice regularPrice' 
        })
        .populate('shippingAddress.addressDocId')
        .exec();

    const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];
   
    console.log("Order with specific address:", specificAddress);

    console.log("Order details :",orders)

    res.render('order-details', { 
        orders, 
        shippingAddress: specificAddress, 
        activePage: 'orders' 
    });
};



const cancelOrder = async (req, res) => {
    const orderId = req.params.id;

    try {
       
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

      
        if (order.order_status === 'Canceled' || order.order_status === 'Delivered') {
            return res.status(400).send('Order cannot be canceled');
        }

       
        order.order_status = 'Canceled';
        order.canceled_at = new Date();

        
        await order.save();


        for (const item of order.products) {
            await Product.findByIdAndUpdate(
                item.product_id,
                { $inc: { quantity: item.quantity } },
                { new: true }
            );
        }

        res.redirect(`/order-details/${orderId}`);

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
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
    selectAddress,
    orderDetails,
    cancelOrder
}