
const env = require('dotenv').config();
const { getIo } = require('../../config/socket');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Coupon = require('../../models/couponSchema')
const crypto = require("crypto");

const PDFDocument = require('pdfkit');
const fs = require('fs');



const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function calculateCheckoutTotals(userId, couponCode) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter(item => item.product_id);

    let cartTotal = 0;
    let offerDiscount = 0;

    // Calculate cart total with offer discounts
    for (const item of cartItems) {
        if (item.product_id) {
            const variantId = item.variant_id;
            const variant = item.product_id.variants.find(v => v._id.toString() === variantId.toString());
            if (variant) {
                const salePrice = variant.salePrice;
                const offerPrice = item.product_id.offer?.discountPercentage
                    ? Math.round(salePrice * (1 - item.product_id.offer.discountPercentage / 100))
                    : salePrice;

                cartTotal += offerPrice * item.quantity;

                // Track offer-based discounts
                const discountPerItem = salePrice - offerPrice;
                offerDiscount += discountPerItem * item.quantity;
            }
        }
    }

    const shippingCharges = cartTotal > 500 ? 0 : 50;

    // Handle coupon discount
    let couponDiscount = 0;
    let couponMessage = '';
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (coupon) {
            const now = new Date();
            if (now >= coupon.startDate && now <= coupon.endDate && coupon.timesUsed < coupon.usageLimit) {
                if (cartTotal >= coupon.minOrderValue) {
                    if (coupon.discountType === 'percentage') {
                        couponDiscount = Math.min((cartTotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
                    } else if (coupon.discountType === 'fixed') {
                        couponDiscount = Math.min(coupon.discountValue, coupon.maxDiscount || Infinity);
                    }
                } else {
                    couponMessage = 'Order does not meet the minimum value for this coupon.';
                   
                }
            } else if (coupon.timesUsed >= coupon.usageLimit) {
                couponMessage = 'Coupon usage limit exceeded.';
              

            } else {
                couponMessage = 'Coupon expired.';
              
            }
        } else {
            couponMessage = 'Invalid coupon code.';
           
        }
    }

    const netAmount = cartTotal - couponDiscount + shippingCharges;

    return {
        cartTotal: cartTotal.toFixed(2),
        offerDiscount: offerDiscount.toFixed(2),
        couponDiscount: couponDiscount.toFixed(2),
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
        couponMessage,
    };
}


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

        const couponCode = req.query.couponCode;
        if (!couponCode) {
            return res.status(400).json({ error: "Coupon code is required." });
        }

        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (!coupon) {
            return res.status(400).json({ couponMessage: "Invalid or expired coupon code." });
        }

        if (coupon.timesUsed >= coupon.usageLimit) {
            return res.status(400).json({ couponMessage: "Coupon usage limit exceeded." });
        }

        

        const updatedCheckoutTotals = await calculateCheckoutTotals(userId, couponCode);

        

       if(updatedCheckoutTotals.cartTotal < coupon.minOrderValue){
        return res.status(400).json({ couponMessage: "Order does not meet the minimum value for this coupon." });
       }


        if (!updatedCheckoutTotals.couponMessage) {
            coupon.timesUsed += 1;
            await coupon.save();
        }

        req.session.couponCode = couponCode;

        console.log("Updated checkout total:",updatedCheckoutTotals)

        res.json({
            cartCount: user.cart.length,
            cartTotal: updatedCheckoutTotals.cartTotal,
            offerDiscount: updatedCheckoutTotals.offerDiscount, 
            couponDiscount: updatedCheckoutTotals.couponDiscount, 
            shippingCharges: updatedCheckoutTotals.shippingCharges,
            netAmount: updatedCheckoutTotals.netAmount,
            couponMessage: updatedCheckoutTotals.couponMessage || null,
        });


        
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ error: "An error occurred while applying the coupon. Please try again." });
    }
};


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

        const cartItems = user.cart.map((item) => {
            const product = item.product_id;
            if (!product) return null;

            const selectedVariant = product.variants.find(
                (variant) => variant._id.toString() === item.variant_id.toString()
            );
            const salePrice = selectedVariant?.salePrice || 0;
            return {
                product,
                selectedVariant,
                salePrice,
                quantity: item.quantity,
            };
        }).filter(item => item !== null);

        // Fetch available coupons
        const now = new Date();
        const coupons = await Coupon.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now },
        })

        // Calculate checkout totals with the applied coupon (if any)
        const appliedCoupon = req.session.couponCode || null;
        const updatedCheckoutTotals = await calculateCheckoutTotals(userId, appliedCoupon);

        const totalSalePrice = cartItems.reduce((total, item) => {
            return total + item.salePrice * item.quantity;
        }, 0);

        console.log('Updated Checkout Totals:', updatedCheckoutTotals);

        res.render('checkout', {
            user,
            address: savedAddress,
            cartCount: user.cart.length,
            coupons,
            totalSalePrice ,
            appliedCoupon,
            isCouponApplied: !!appliedCoupon,
            ...updatedCheckoutTotals, 
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
        const addressId = req.session.selectedAddress;

        const user = await User.findById(userId).populate({
            path: 'cart.product_id',
            select: 'productName productImage',
        });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const cartItems = user.cart.filter(item => item.product_id);
        if (!cartItems.length) {
            return res.status(400).json({ message: "Cart is empty." });
        }


        const { netAmount } = await calculateCheckoutTotals(userId, couponCode);
        const amountInPaise = netAmount * 100;
        const addressDoc = await Address.findOne({ user_id: userId });
        const selectedIndex = addressDoc.address.findIndex(addr => addr._id.equals(addressId));
        if (selectedIndex === -1) {
            return res.status(404).json({ message: "Address not found." });
        }

        // Create a Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `order_rcptid_${Date.now()}`,
            notes: { userId },
        });

        console.log("Razorpay Order Created:", razorpayOrder);

        // Map cart items to order format
        const products = cartItems.map(item => ({
            product_id: item.product_id._id,
            variant_id: item.variant_id,
            quantity: item.quantity,
        }));

        // Save the Razorpay order to the database
        const newOrder = new Order({
            user_id: userId,
            products,
            total_price: netAmount,
            payment_method: 'Razorpay',
            razorpay_order_id: razorpayOrder.id,
            payment_status: "Pending",

            shippingAddress: {
                addressDocId: addressDoc._id,
                addressIndex: selectedIndex,
            },
            delivery_date: getRandomDeliveryDate(),
        });

        const savedOrder = await newOrder.save();
        console.log("Saved Order:", savedOrder);

        const userData = await User.findById(userId);
        userData.cart = [];  
        await userData.save();

        // Send response to the client
        res.json({
            id: razorpayOrder.id,  
            keyId: process.env.RAZORPAY_KEY_ID,  
            amount: razorpayOrder.amount,
            orderId: savedOrder._id, 
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        console.log("Received payment details:", razorpay_payment_id, razorpay_order_id, razorpay_signature);

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        console.log("Generated signature:", generatedSignature);
        console.log("razorpay signature:", razorpay_signature)

        if (generatedSignature === razorpay_signature) {
            // Check if the Razorpay order exists in the database
            const order = await Order.findOne({ razorpay_order_id: razorpay_order_id });

            if (!order) {
                console.log("Order not found for razorpay_order_id:", razorpay_order_id);
                return res.status(400).json({ success: false, message: "Order not found." });
            }

            // Update order status to "Completed"
            order.payment_status = "Completed";
            order.order_status = "Dispatch"
            await order.save();

            console.log("Order updated successfully:", order);
            res.json({ success: true });
        } else {
            // If the signature does not match, mark the Razorpay order as "Pending"
            const order = await Order.findOne({ razorpay_order_id: razorpay_order_id });

            if (order) {
                order.payment_status = "Pending"; 
                order.order_status = "Pending"
                await order.save();
                console.log("Payment verification failed, marked as Pending:", order);
            }

            console.log("Signature mismatch");
            res.status(400).json({ success: false, message: "Payment verification failed." });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


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
        const { netAmount, discount } = await calculateCheckoutTotals(userId, couponCode);
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
            if(netAmount > 1000){
                return res.status(400).json({ success: false, message: "You can't allow the COD if the order is above ₹1000" });  
            }
            paymentStatus = "Completed";
        } else if (payment_method === "Wallet") {
          
            console.log("Wallet balance:", user.wallet);
          
            console.log("Net amount:", netAmount);
            if (user.wallet < netAmount) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
            }

            user.wallet -= netAmount;
            user.transactions.push({
                type: "debit",
                amount: netAmount,
                description: "Order Payment",
                date: new Date(),
            });
            await user.save();
            paymentStatus = "Completed";
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment method." });
        }

        // Save the order
        const newOrder = new Order({
            user_id: userId,
            products: orderProducts,
            total_price: netAmount,
            payment_method,
            discountAmount: discount,
            payment_status: paymentStatus,
            order_status : "Dispatch",
            razorpay_order_id: razorpayOrderId,
            shippingAddress: {
                addressDocId: addressDoc._id,
                addressIndex: selectedIndex,
            },
            delivery_date: deliveryDate,
        });

        const savedOrder = await newOrder.save();
        console.log("Saved Order:", savedOrder);

        if (payment_method === "Razorpay") {
            return res.json({
                message: "Proceed to complete the Razorpay payment.",
                razorpayOrderId,
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: savedOrder._id,
            });
        }

        for (const item of user.cart) {
            // Fetch the product and specific variant
            const product = await Product.findOne(
                { _id: item.product_id._id, "variants._id": item.variant_id },
                { "variants.$": 1 } // Fetch only the matching variant
            );
        
            if (product) {
                const variant = product.variants[0];
        
                // Calculate the new stock
                const newStock = variant.stock - item.quantity;
        
                // Determine the new status based on stock
                let newStatus = "Unavailable"; // Default
                if (newStock > 0) {
                    newStatus = "Available";
                } else if (newStock === 0) {
                    newStatus = "Out of Stock";
                }
        
                // Update the stock and status in the database
                await Product.updateOne(
                    { _id: item.product_id._id, "variants._id": item.variant_id },
                    {
                        $set: {
                            "variants.$.stock": newStock,
                            "variants.$.status": newStatus,
                        },
                    }
                );
            }
        }
        
        // Clear the cart
        user.cart = [];
        await user.save();

        res.json({ success: true, message: "Order confirmed successfully.", orderId: savedOrder._id });
    } catch (error) {
        console.error("Error confirming order:", error);
        res.status(500).json({ message: "An error occurred while confirming the order. Please try again." });
    }
};

const getOrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user;
        console.log("User ID:", userId);

        const userData = await User.findById(userId);

        // Fetch orders and populate product details
        const orders = await Order.find({ user_id: userId })
            .populate('products.product_id', 'productName productImage variants') 
            .sort({ createdAt: -1 }) 
            .exec();

        console.log("Orders:", orders);

        // Add variant details for each product
        const structuredOrders = orders.map((order) => {
            const productsWithVariants = order.products.map((product) => {
                const productData = product.product_id;
                const variantDetails = productData.variants.find(
                    (variant) => variant._id.toString() === product.variant_id.toString()
                );

                return {
                    ...product.toObject(),
                    variantDetails: variantDetails || {}, // Attach variant details
                };
            });

            return {
                ...order.toObject(),
                products: productsWithVariants,
            };
        });

        const completedOrders = structuredOrders.filter(
            (order) => order.payment_status === 'Completed'
        );
        const pendingOrders = structuredOrders.filter(
            (order) => order.payment_status === 'Pending'
        );
        const pendingOrder = pendingOrders.length > 0 ? pendingOrders[0] : null;

        res.render('order-confirmation', {
            orders: structuredOrders,
            completedOrders,
            pendingOrders,
            activePage: 'orders',
            user: userData,
            isPaymentPending: pendingOrders.length > 0,
            payment_method: pendingOrder ? pendingOrder.payment_method : null,
            razorpay_order_id: pendingOrder ? pendingOrder.razorpay_order_id : null,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.redirect('/pagenotfound');
    }
};


const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;

        const user = req.session.user ? await User.findById(req.session.user) : null;

        const orders = await Order.findById(orderId)
            .populate({
                path: 'products.product_id',
                select: 'productName productImage salePrice regularPrice',
            })
            .populate('shippingAddress.addressDocId')
            .exec();

        if (!orders) {
            return res.redirect('/pagenotfound');
        }

        for (let item of orders.products) {
            const variant = await Product.findOne({
                _id: item.product_id._id,
                "variants._id": item.variant_id,
            });

            if (variant) {
                const variantDetails = variant.variants.find(v => v._id.toString() === item.variant_id.toString());
                item.variantDetails = variantDetails || {}; 
            } else {
                item.variantDetails = {}; 
            }
        }

        const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];

  

        res.render('order-details', {
            orders,
            shippingAddress: specificAddress,
            activePage: 'orders',
            user
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

//cancellation of order

const cancelOrder = async (req, res) => {
    const orderId = req.params.id;
    const { reason, customReason } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            console.log("Order not found for ID:", orderId);
            return res.status(404).send('Order not found');
        }

        if (['Canceled', 'Delivered'].includes(order.order_status)) {
            console.log("Order cannot be canceled. Current status:", order.order_status);
            return res.status(400).send('Order cannot be canceled');
        }

        // Mark the order as "Pending Cancellation"
        order.order_status = 'Pending Cancellation';
        order.cancellation_reason = { predefined: reason, custom: customReason };
        await order.save();

        const cancellationData = {
            orderId: orderId,
            reason: reason,
            customReason: customReason || '',
        };

        const io = getIo();
        io.emit('order_cancellation_request', cancellationData);

        res.redirect(`/order-details/${orderId}?message=Cancellation request submitted successfully`);
    } catch (error) {
        console.error("Error in cancelOrder:", error);
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



const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ error: "Please login to proceed." });
        }

        const user = await User.findById(userId).populate('cart.product_id');
        if (!user || user.cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty! Please add a product." });
        }

        const coupon = await Coupon.findOne({ code: req.session.couponCode });
        if (coupon) {
            // Decrement the timesUsed if the coupon exists
            coupon.timesUsed -= 1;
            await coupon.save();
        }

        // Clear the coupon code from the session
        req.session.couponCode = null;

        // Recalculate checkout totals without the coupon
        const updatedCheckoutTotals = await calculateCheckoutTotals(userId, null);

        // Return updated checkout totals
        res.json({
            cartCount: user.cart.length,
            cartTotal: updatedCheckoutTotals.cartTotal,
            offerDiscount: updatedCheckoutTotals.offerDiscount, 
            couponDiscount: 0, 
            shippingCharges: updatedCheckoutTotals.shippingCharges,
            netAmount: updatedCheckoutTotals.netAmount,
            couponMessage: null, 
        });
        
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ error: "An error occurred while removing the coupon. Please try again." });
    }
};

const returnReason = async (req, res) => {
    const { orderId, returnReason, additionalInfo } = req.body;

    try {
        // Check if the order exists and is delivered
        const order = await Order.findById(orderId);
        if (!order || order.order_status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Order not found or not delivered yet.' });
        }

        // Update the order's return status and reason
        order.order_status = "Return"
        order.return_status = 'Pending';
        order.return_reason = returnReason;
        if (additionalInfo) {
            order.additional_info = additionalInfo;
        }

        await order.save();
        res.json({ success: true, message: 'Return request submitted successfully.' });
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Failed to process return request.' });
    }
}


const getReturnPage = async(req,res)=>{
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order || order.order_status !== 'Delivered') {
            return res.status(400).send('Invalid order or the order is not delivered yet.');
        }

        // Render the return form page, where the user can submit the reason
        res.render('return', { orderId });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('An error occurred.');
    }
}
async function generateInvoice(req, res) {
    const orderId = req.params.orderId;

    try {
        // Fetch the order and populate related fields
        const order = await Order.findById(orderId)
            .populate('user_id')
            .populate('products.product_id')
            .populate('shippingAddress.addressDocId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create a PDF document
        const doc = new PDFDocument({ margin: 50 });
        const filename = `Invoice_${orderId}.pdf`;

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // Header Section
        doc
            .fontSize(20)
            .fillColor('#000000') // Black color for main headings
            .font('Helvetica-Bold')
            .text('Invoice', { align: 'center' })
            .moveDown(0.5);

        // Order Details
        doc
            .fontSize(12)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`Order ID: ${orderId}`, 50, doc.y)
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, doc.y);

        doc.moveDown(1);

        // Customer Details
        const user = order.user_id;
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#007BFF') // Blue for section headers
            .text('Customer Details:', 50, doc.y)
            .moveDown(0.2)
            .font('Helvetica')
            .fillColor('#000000') // Black for text values
            .fontSize(12)
            .text(`Name: ${user.full_name}`)
            .text(`Email: ${user.email}`)
            .text(`Phone: ${user.phone || 'N/A'}`)
            .moveDown();

        // Shipping Address
        const addressDoc = order.shippingAddress?.addressDocId;
        const specificAddress =
            addressDoc?.address[order.shippingAddress.addressIndex] || {};
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#007BFF')
            .text('Shipping Address:', 50, doc.y)
            .moveDown(0.2)
            .font('Helvetica')
            .fillColor('#000000')
            .fontSize(12)
            .text(
                `${specificAddress.streetAddress || 'N/A'}, ${specificAddress.city || 'N/A'}, ${specificAddress.pincode || 'N/A'}`
            )
            .text(`Phone: ${specificAddress.phone || 'N/A'}`)
            .moveDown();

        // Products Table
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#007BFF')
            .text('Products:', 50, doc.y)
            .moveDown(0.5);

        const tableTop = doc.y;
        const productTableHeaders = ['Product', 'Variant', 'Quantity', 'Price', 'Total'];

        // Draw Table Header
        let x = 50;
        productTableHeaders.forEach((header) => {
            doc.fontSize(12).font('Helvetica-Bold').text(header, x, tableTop, {
                width: 100,
                align: 'center',
            });
            x += 100;
        });

        // Draw Table Rows
        let y = tableTop + 20;
        let totalPrice = 0;

        order.products.forEach((item) => {
            const product = item.product_id;
            const variant = product.variants.find((v) => v._id.equals(item.variant_id));
            const unitPrice = variant.salePrice || variant.regularPrice;
            const itemTotal = unitPrice * item.quantity;
            totalPrice += itemTotal;

            doc
                .fontSize(12)
                .font('Helvetica')
                .fillColor('#000000')
                .text(product.productName, 50, y, { width: 100, align: 'center' })
                .text(`${variant.color}, ${variant.size}`, 150, y, {
                    width: 100,
                    align: 'center',
                })
                .text(item.quantity, 250, y, { width: 100, align: 'center' })
                .text(`₹${unitPrice.toFixed(2)}`, 350, y, { width: 100, align: 'center'})
                .text(`₹${itemTotal.toFixed(2)}`, 450, y, { width: 100, align: 'center'});
            y += 20;
        });

        doc.moveDown(2);

        // Split Section: Order Summary (Left) & Payment Details (Right)
        const leftColumnX = 50;
        const rightColumnX = 400;
        const sectionMarginTop = y + 20;

        // Order Summary (Left)
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#007BFF')
            .text('Order Summary:', leftColumnX, sectionMarginTop)
            .moveDown(0.2)
            .font('Helvetica')
            .fillColor('#000000')
            .fontSize(12)
            .text(`Total Price (before discount): ₹${totalPrice.toFixed(2)}`, leftColumnX, doc.y)
            .text(`Discount Applied: -₹${order.discountAmount.toFixed(2)}`, leftColumnX, doc.y)
            .text(
                `Final Amount to Pay: ₹${(
                    totalPrice - order.discountAmount
                ).toFixed(2)}`,
                leftColumnX,
                doc.y
            );

        // Payment Details (Right, Corner)
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#007BFF')
            .text('Payment Details:', rightColumnX, sectionMarginTop)
            .moveDown(0.2)
            .font('Helvetica')
            .fillColor('#000000')
            .fontSize(12)
            .text(`Payment Method: ${order.payment_method}`, rightColumnX, doc.y)
            .text(`Payment Status: ${order.payment_status}`, rightColumnX, doc.y);

        // Finalize and Close PDF
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while generating invoice.' });
    }
}

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;  // This is the razorpay_order_id
        const userId = req.session.user;
        const couponCode = req.body.couponCode || null;

        // Fetch the order using razorpay_order_id (not _id)
        const order = await Order.findOne({ razorpay_order_id: orderId });

        console.log("Order details fetched by razorpay:",order)
        
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.payment_status !== "Pending") {
            return res.status(400).json({ message: "This order has already been paid." });
        }

        // Create a new Razorpay order for the same amount
        const netAmount = order.total_price
        const amountInPaise = netAmount * 100;

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            notes: { userId },
        });

        // Update the order with the new Razorpay order ID
        order.razorpay_order_id = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            razorpay_order_id: razorpayOrder.id,
            keyId: process.env.RAZORPAY_KEY_ID,  
            orderId: order._id, 
            amount: razorpayOrder.amount / 100,
        });
    } catch (error) {
        console.error('Error retrying payment:', error);
        res.status(500).json({ success: false, message: 'Failed to retry payment.' });
    }
};



const RetryPaymentVerification = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // Retrieve Razorpay secret from environment
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) {
            throw new Error("Razorpay secret key is not defined.");
        }

        // Generate HMAC signature
        const hmac = crypto.createHmac('sha256', razorpaySecret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const expectedSignature = hmac.digest('hex');

        // Verify signature
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

       
        // Update order status in your database
        await Order.findOneAndUpdate(
            { razorpay_order_id },
            { payment_status: 'Completed', razorpay_payment_id , order_status : "Dispatch"},
            { new: true }
        );

        res.json({ success: true, message: 'Payment verified successfully.' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment.', error: error.message });
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
    removeCoupon,
    verifyPayment,
    createRazorpay,
    getReturnPage,
    returnReason,
    generateInvoice,
    retryPayment,
    RetryPaymentVerification
}