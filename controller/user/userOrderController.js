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
    const userId = req.session.user;
    const { recipient_name, streetAddress, city, state, landmark, pincode, addressType, phone, altPhone } = req.body;

    try {
        // Create new address object
        const newAddress = {
            recipient_name,
            streetAddress,
            city,
            state,
            landmark,
            pincode,
            addressType,
            phone,
            altPhone
        };

        // Assuming Address schema has a user_id field referencing User
        const updatedAddress = await Address.findOneAndUpdate(
           {user_id : userId},
            { $push: { address: newAddress } }, // Push new address to address array
            { new: true } // Return the updated user document
        );

        if (!updatedAddress) {
            return res.status(404).json({ message: 'Address is not added.' });
        }

        res.json({ message: 'Address added successfully!',updatedAddress });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};



const getAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        const addressDoc = await Address.findOne({ "address._id" : addressId});

        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Extract the specific address object
        const address = addressDoc.address.find(addr => addr._id.toString() === addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found in the address list.' });
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

        const updatedAddress = await Address.findOneAndUpdate(
            { "address._id": addressId },
            {
                $set: {
                    "address.$.recipient_name": recipient_name,
                    "address.$.streetAddress": streetAddress,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone,
                    "address.$.altPhone": altPhone,
                    "address.$.addressType": addressType,
                },
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

    console.log("selected address:",addressId)

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


const getRating = async(req,res)=>{
    try{

        const productId = req.query.id;
        const userId = req.session.user;

        const product = await Product.findById(productId);

        const user = await User.findById(userId)
        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('rating-review',{
            product,
            user
        })

    }catch(error){
        console.error(error);
        res.status(500).send('Server Error');
    }
}

const submitRating = async (req, res) => {

    const { productId, userId, rating } = req.body;

    try {
        // Verify if the productId exists
        console.log("Received productId:", productId);
        // Find the product and check if it exists
        const product = await Product.findOne({_id : productId});
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find if the user has already rated the product
        const existingRating = product.reviews.find(review => review.user_id.toString() === userId);

        if (existingRating) {
            // If the user has already rated the product, update their rating and description
            existingRating.rating = rating;
        } else {
            // If it's a new rating, add the review and rating to the product's reviews array
            product.reviews.push({ user_id: userId, rating: rating });
        }

        // Recalculate average rating and total ratings
        const totalRatings = product.reviews.length;
        const averageRating = totalRatings > 0 
            ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings 
            : 0;

        product.ratings.average = averageRating;
        product.ratings.count = totalRatings;

        await product.save();

        res.status(200).json({
            message: 'Rating submitted successfully',
            updatedRating: averageRating,
            totalRatings: totalRatings
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};



const submitReviews = async(req, res) => {
    const { productId, userId, description, title  } = req.body;

    try {
        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Add review to product
        const review = {
            user_id: userId,
            description,
            title,
        
        };

        product.reviews.push(review);
        

        await product.save();
        
        res.status(200).json({ message: 'Review submitted successfully'});
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}

const getProductRatings = async (req, res) => {
    const { product_id } = req.params;

    try {
        // Find the product by ID
        const product = await Product.findById(product_id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Handle case where ratings object might not be initialized
        const averageRating = product.ratings && product.ratings.average ? product.ratings.average : 0;
        const totalRatings = product.ratings && product.ratings.count ? product.ratings.count : 0;

        res.status(200).json({
            averageRating,
            totalRatings
        });
    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ message: 'Error fetching ratings', error });
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
    cancelOrder,
    getRating,
    submitRating,
    getProductRatings,
    submitReviews

}