const env = require('dotenv').config();
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Coupon = require('../../models/couponSchema')
const crypto = require("crypto");


const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function calculateCheckoutTotals(userId, couponCode) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    let cartTotal = 0;

    // Calculate cart total
    for (const item of cartItems) {
        if (item.product_id) {
            const variantId = item.variant_id;
            const variant = item.product_id.variants.find(v => v._id.toString() === variantId.toString());
            if (variant) {
                const price = variant.salePrice || variant.regularPrice;
                cartTotal += price * item.quantity;
            } else {
                console.log(`Variant not found for product ${item.product_id._id} with variantId ${variantId}`);
            }
        }
    }

    // Default shipping charges
    const shippingCharges = cartTotal > 500 ? 0 : 50;

    // Fetch and validate coupon
    let discount = 0;
    let couponMessage = '';
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (coupon) {
            const now = new Date();
            if (now >= coupon.startDate && now <= coupon.endDate) {
                // Check coupon applicability
                let isApplicable = false;
                if (coupon.applicableTo === 'order') {
                    isApplicable = true; // Order-wide coupon
                } else if (coupon.applicableTo === 'product') {
                    isApplicable = cartItems.some(item => item.product_id._id.toString() === coupon.productId?.toString());
                } else if (coupon.applicableTo === 'category') {
                    isApplicable = cartItems.some(item => item.product_id.category.toString() === coupon.categoryId?.toString());
                }

                if (isApplicable && cartTotal >= coupon.minOrderValue) {
                    if (coupon.discountType === 'percentage') {
                        discount = Math.min((cartTotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
                    } else if (coupon.discountType === 'fixed') {
                        discount = Math.min(coupon.discountValue, coupon.maxDiscount || Infinity);
                    }
                } else {
                    couponMessage = 'Coupon not applicable to this cart.';
                }
            } else {
                couponMessage = 'Coupon expired.';
            }
        } else {
            couponMessage = 'Invalid coupon code.';
        }
    }

    const netAmount = cartTotal - discount + shippingCharges;

    console.log("Discount amount :" + discount);
    console.log("Net amount :" + netAmount);

    return {
        cartTotal: cartTotal.toFixed(2),
        discount: discount.toFixed(2),
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
        couponMessage,
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

        // Fetch available coupons
        const now = new Date();
        const coupons = await Coupon.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now },
        });

        const updatedCheckoutTotals = await calculateCheckoutTotals(userId, req.query.couponCode || null);

        console.log("Updated Checkout", updatedCheckoutTotals);

        // Return updated cart totals and coupon data
        res.render('checkout', {
            user,
            address: savedAddress,
            cartCount: user.cart.length,
            coupons,
            appliedCoupon: req.query.couponCode || null,
            ...updatedCheckoutTotals,
        });
    } catch (error) {
        console.error("Error loading checkout page:", error);
        req.flash('error', "An error occurred. Please try again.");
        res.redirect('/cart');
    }
};

const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ error: "Please login to apply a coupon." });
        }

        const user = await User.findById(userId).populate('cart.product_id');
        if (!user || user.cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty! Please add a product." });
        }

        // Fetch the coupon code from the query
        const couponCode = req.query.couponCode;
        if (!couponCode) {
            return res.status(400).json({ error: "Coupon code is required." });
        }

        // Check if coupon is valid
        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (!coupon) {
            return res.status(400).json({ couponMessage: "Invalid or expired coupon code." });
        }

        // Calculate the updated totals
        const updatedCheckoutTotals = await calculateCheckoutTotals(userId, couponCode);

        console.log("Updated Checkout after applying coupon:", updatedCheckoutTotals);

        req.session.couponCode = couponCode;

        // Return updated checkout totals and coupon data in the response
        res.json({
            cartCount: user.cart.length,
            cartTotal: updatedCheckoutTotals.cartTotal,
            discount: updatedCheckoutTotals.discount,
            shippingCharges: updatedCheckoutTotals.shippingCharges,
            netAmount: updatedCheckoutTotals.netAmount,
            couponMessage: updatedCheckoutTotals.couponMessage || null,
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ error: "An error occurred while applying the coupon. Please try again." });
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


const createRazorpay = async (req, res) => {
    try {
        const userId = req.session.user;
        const couponCode = req.session.couponCode; 

        const { netAmount } = await calculateCheckoutTotals(userId,couponCode);
        
        const amountInPaise = netAmount * 100;

        // Create a Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise, 
            currency: 'INR',
            receipt: `order_rcptid_${Date.now()}`,
            notes: {
                userId,
            },
        });

        // Send back order ID and Razorpay key to frontend
        res.json({
            id: razorpayOrder.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature === razorpay_signature) {
            // Update order status to "Completed" in the database
            await Order.findOneAndUpdate(
                { razorpay_order_id },
                { payment_status: "Completed" }
            );

            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed." });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


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
      try {
          const userId = req.session.user;
          const addressId = req.session.selectedAddress;
          const couponCode = req.session.couponCode;
          const { payment_method } = req.body;
  
          if (!userId || !addressId) {
              return res.status(400).json({ message: "User or address information missing." });
          }
  
          const user = await User.findById(userId).populate("cart.product_id");
          if (!user || !user.cart.length) {
              return res.status(400).json({ message: "Cart is empty. Please add items to proceed." });
          }
  
          const addressDoc = await Address.findOne({ user_id: userId });
          const selectedIndex = addressDoc.address.findIndex(addr => addr._id.equals(addressId));
          if (selectedIndex === -1) {
              return res.status(404).json({ message: "Address not found." });
          }
  
          // Calculate checkout totals, including discount
          const { netAmount,discount } = await calculateCheckoutTotals(userId, couponCode);
  
          const deliveryDate = getRandomDeliveryDate();
  
          // Fetch variant details and build the order products array
          const orderProducts = [];
          for (const item of user.cart) {
              const variant = item.product_id.variants.find(v => v._id.toString() === item.variant_id.toString());
              if (!variant) {
                  return res.status(400).json({ message: `Variant not found for product ${item.product_id._id}` });
              }
  
              orderProducts.push({
                  product_id: item.product_id._id,
                  variant_id: item.variant_id,
                  quantity: item.quantity,
              });
          }
  
          let paymentStatus = "Pending";
          let razorpayOrderId = null;
          const amountInPaise = netAmount * 100;
  
          if (payment_method === "Razorpay") {
              // Create a Razorpay order
              const razorpayOrder = await razorpay.orders.create({
                  amount: amountInPaise,
                  currency: "INR",
                  receipt: `order_rcptid_${Date.now()}`,
                  notes: { userId },
              });
  
              razorpayOrderId = razorpayOrder.id;
          } else if (payment_method === "COD") {
              paymentStatus = "Completed";
          }
  
          // Save the order
          const newOrder = new Order({
              user_id: userId,
              products: orderProducts,
              total_price: netAmount,
              payment_method,
              discountAmount : discount,
              payment_status: paymentStatus,
              razorpay_order_id: razorpayOrderId,
              shippingAddress: {
                  addressDocId: addressDoc._id,
                  addressIndex: selectedIndex,
              },
              delivery_date: deliveryDate,
          });
  
          await newOrder.save();
  
          if (payment_method === "Razorpay") {
              return res.json({
                  message: "Proceed to complete the Razorpay payment.",
                  razorpayOrderId,
                  keyId: process.env.RAZORPAY_KEY_ID,
                  orderId: newOrder._id,
              });
          }
  
          // Update stock for each product's variant
          for (const item of user.cart) {
              await Product.updateOne(
                  { _id: item.product_id._id, "variants._id": item.variant_id },
                  { $inc: { "variants.$.stock": -item.quantity } }
              );
          }
  
          // Clear the cart
          user.cart = [];
          await user.save();
  
          res.json({ message: "Order confirmed successfully.", orderId: newOrder._id });
      } catch (error) {
          console.error("Error confirming order:", error);
          res.status(500).json({ message: "An error occurred while confirming the order. Please try again." });
      }
  };
  
const getOrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user;

        // Fetch all orders for the user
        const orders = await Order.find({ user_id: userId })
            .populate('products.product_id') 
            .populate('products.variant_id')  
            .exec();

        // Iterate through orders to populate the variant details manually
        for (let order of orders) {
            for (let item of order.products) {
                // Retrieve the correct variant details
                const product = item.product_id;
                const variant = product.variants.find(v => v._id.toString() === item.variant_id.toString());

                // Attach the variant details to the item
                item.variantDetails = variant || {}; 
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
            
            const variant = await Product.findOne({
                _id: item.product_id._id,
                "variants._id": item.variant_id 
            });

            if (variant) {
                const variantDetails = variant.variants.find(v => v._id.toString() === item.variant_id.toString());
                item.variantDetails = variantDetails || {}; 
            } else {
                item.variantDetails = {}; 
            }
        }

        // Fetch the specific shipping address for the order
        const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];

        console.log("Order with specific address:", specificAddress);
        console.log("Order details:", orders);

        // Render the order details page with all the necessary data
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

        // Restock the product variant stock
        for (const item of order.products) {
            const product = await Product.findById(item.product_id);

            const variant = product.variants.find(variant => variant._id.toString() === item.variant_id.toString());

            if (variant) {
                variant.stock += item.quantity;
                await product.save();
            }
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
    getCancelConfirmation,
    applyCoupon,
    verifyPayment,
    createRazorpay

}