const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const ProductVariant = require('../../models/productVariantSchema')
const User = require('../../models/userSchema')


async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    console.log("Items in cart : ", cartItems);

    let cartTotal = 0;

    for (const item of cartItems) {
        if (item.product_id) {
            // Fetch the corresponding variant from the ProductVariant collection by product_id
            const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });

            console.log("Product variants:", productVariant);

            if (productVariant && productVariant.variant.length > 0) {
                // Get the first variant (or any logic you want to choose a variant)
                const variant = productVariant.variant[0];  // Picking the first variant as default

                
                const price = variant.salePrice || variant.regularPrice;
                cartTotal += price * item.quantity;
                console.log("Product variant price:", price);
            } else {
                console.log(`No variants found for product ${item.product_id._id}`);
            }
        } else {
            console.log("Item missing product_id:", item);
        }

        console.log("Product Items for search:", item.product_id._id);
    }

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
        if (!userId) {
            req.flash('error', "Please login to proceed.");
            return res.redirect('/login');
        }

        const savedAddress = await Address.find({ user_id: userId });
        const user = await User.findById(userId).populate('cart.product_id');

        if (!user || user.cart.length === 0) {
            req.flash('error', "Cart is empty! Please add a product.");
            return res.redirect('/cart');
        }

        // Add variant data to cart items and check for valid product_id
        for (let item of user.cart) {
            if (item.product_id) {  // Check if product_id exists
                try {
                    const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });
                    if (productVariant && productVariant.variant.length > 0) {
                        const variant = productVariant.variant[0]; // Selecting the first variant as the default
                        item.variant = variant; // Assign the variant to the item
                    }
                } catch (err) {
                    console.error('Error fetching product variant:', err);
                }
            } else {
                console.warn('Product ID is missing for item:', item);
            }
        }

        // Now safely map order products
        const orderProducts = user.cart
            .filter(item => item.product_id)  // Only include items with a valid product_id
            .map(item => ({
                product_id: item.product_id._id,
                quantity: item.quantity,
            }));

        if (orderProducts.length === 0) {
            req.flash('error', "No valid products in the cart. Please add a product.");
            return res.redirect('/cart');
        }

        // Calculate cart totals with variants
        const updatedCartTotals = await calculateCartTotals(userId);

        // Render the checkout page
        res.render('checkout', {
            user,
            address: savedAddress,
            cartCount: orderProducts.length,
            ...updatedCartTotals,
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
            { user_id: userId }, 
            { $push: { address: newAddress } },
            { new: true, upsert: true } 
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

        const addressDoc = await Address.findOne({"address._id" : addressId});

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

    const userId = req.session.user

    const selectedAddressId = req.session.selectedAddress;
    const user = userId ? await User.findById(userId) : null;

    if (!selectedAddressId) {
        return res.redirect('/checkout');
    }

    res.render('payment',{user});
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
    const cartItems = user.cart.filter(item => item.product_id); // Only include items with a valid product_id
    console.log('Valid Cart items:', cartItems); // Log valid cart items

    const addressDoc = await Address.findOne({ user_id: userId });
    const selectedIndex = addressDoc.address.findIndex(addr => addr._id.equals(addressId));

    if (selectedIndex === -1) {
        return res.status(404).json({ message: "Address not found" });
    }

    // Fetch the variant sale price for each item
    let totalPrice = 0;
    for (const item of cartItems) {
        if (item.product_id) {
            // Fetch the product variant based on the product
            const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });

            if (productVariant && productVariant.variant.length > 0) {
                // Get the first variant (or you can implement a logic to choose a specific variant)
                const variant = productVariant.variant[0];  // Use the first variant for simplicity

                // Calculate the total price using the sale price of the variant
                totalPrice += variant.salePrice * item.quantity;
            } else {
                console.error(`No variant found for product ${item.product_id._id}`);
            }
        }
    }

    const deliveryDate = getRandomDeliveryDate();

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
        delivery_date: deliveryDate,
    });

    await newOrder.save();

    // Update product quantities in the database
    for (const item of cartItems) {
        if (item.product_id) {
            await Product.findByIdAndUpdate(
                item.product_id._id,
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );
        }
    }

    // Clear the cart after order confirmation
    user.cart = [];
    await user.save();

    res.json({ message: 'Order confirmed successfully.' });
};


const getOrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user;

        const orders = await Order.find({ user_id: userId })
            .populate('products.product_id')
            .exec();
  
            for (let order of orders) {
                for (let item of order.products) {
                    const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });
    
                    if (productVariant) {
                        // Attach variants to the order item
                        item.variantDetails = productVariant.variant;
                    } else {
                        item.variantDetails = []; // No variants found
                    }
                }
            }

            const user = userId ? await User.findById(userId) : null;
        res.render('order-confirmation', {
            orders,
            activePage: 'orders',
            user
        });
    } catch (error) {
        console.error("Error in Loading Orders Page", error);
        res.redirect('/pagenotfound');
    }
};
const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Retrieve the user details
        const user = req.session.user ? await User.findById(req.session.user) : null;

        // Fetch the order details with populated product and shipping address
        const orders = await Order.findById(orderId)
            .populate({
                path: 'products.product_id',
                select: 'productName productImage salePrice regularPrice',
            })
            .populate('shippingAddress.addressDocId')
            .exec();

        // Ensure the order exists
        if (!orders) {
            return res.redirect('/pagenotfound');
        }

        // Fetch variant details for each product in the order
        for (let item of orders.products) {
            const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });
            item.variantDetails = productVariant ? productVariant.variant : [];
        }

        // Retrieve the specific address from the order's shipping details
        const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];

        console.log("Order with specific address:", specificAddress);
        console.log("Order details:", orders);

        // Render the order details page
        res.render('order-details', {
            orders,
            shippingAddress: specificAddress,
            activePage: 'orders',
            user,
        });
    } catch (error) {
        console.error("Error in Loading Order Details Page", error);
        res.redirect('/pagenotfound');
    }
};



const getCancelConfirmation = async(req,res)=>{
    try{
        const orderId = req.query.id;
        const orders = await Order.findById(orderId)
        .populate('user_id')
        .populate('products.product_id')
        .populate('shippingAddress.addressDocId')
        .exec()
        res.render('cancel-confirm',{orders})
    }catch(error){
        console.error("Error in Loading Cancel Confirm Page", error);
        res.redirect('/pagenotfound');
    }
}



const cancelOrder = async (req, res) => {
    const orderId = req.params.id;
    const { reason, customReason } = req.body;

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
        order.cancellation_reason = {
            predefined: reason,
            custom: customReason,
        };
        
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

const getRating = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.user;


        const product = await Product.findById(productId).lean();
        const user = await User.findById(userId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }

        const hasDeliveredOrder = await Order.findOne({
            user_id: userId,
            'products.product_id': productId, 
            order_status: 'Delivered' 
        });

        if (!hasDeliveredOrder) {
         req.flash('error',"You have to order the product first");
         return res.redirect('/products')
        }

        let userRating = 0; 
        const ratingEntry = user.ratedProducts.find(
            (item) => item.product_id.toString() === productId
        );

        if (ratingEntry) {
            userRating = ratingEntry.rating;
        }

        res.render('rating-review', {
            product,
            user,
            userRating
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const submitRating = async (req, res) => {
    const { productId, userId, rating } = req.body;

    try {
        // Find the product and user
        const product = await Product.findById(productId);
        const user = await User.findById(userId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user has already rated the product in their profile
        const existingUserRating = user.ratedProducts.find(
            (item) => item.product_id.toString() === productId
        );

        if (existingUserRating) {
            existingUserRating.rating = rating; // Update the rating in user's profile
        } else {
            user.ratedProducts.push({ product_id: productId, rating });
        }

        // Check if the user has already reviewed the product
        const existingProductReviewIndex = product.reviews.findIndex(
            (review) => review.user_id.toString() === userId
        );

        if (existingProductReviewIndex !== -1) {
            // Update the existing review
            product.reviews[existingProductReviewIndex].rating = rating;
            product.reviews[existingProductReviewIndex].createdAt = new Date(); // Update timestamp
        } else {
            // Add a new review
            product.reviews.push({ user_id: userId, rating, createdAt: new Date() });
        }

        // Recalculate average rating and count
        const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.ratings.count = product.reviews.length;
        product.ratings.average = product.ratings.count ? totalRatings / product.ratings.count : 0;


        await user.save();
        await product.save();

        // Send success response
        res.status(200).json({
            message: 'Rating submitted successfully!',
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Error submitting rating', error });
    }
};



const submitReviews = async (req, res) => {
    const { productId, userId, description, title } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the user has already reviewed the product
        const existingReviewIndex = product.reviews.findIndex(
            (review) => review.user_id.toString() === userId
        );

        if (existingReviewIndex !== -1) {
            // Update the existing review
            product.reviews[existingReviewIndex].description = description;
            product.reviews[existingReviewIndex].title = title;
            product.reviews[existingReviewIndex].updatedAt = new Date(); // Optional timestamp for updates
        } else {
            // Add a new review
            const review = {
                user_id: userId,
                description,
                title,
            };
            product.reviews.push(review);
        }

        await product.save();

        res.status(200).json({ message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error', error });
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
    submitReviews,
    getCancelConfirmation

}