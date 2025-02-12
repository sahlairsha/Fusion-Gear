const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product_id: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true

        },
        variant_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        quantity: {
            type: Number,
        },
    }],
    total_price: {
        type: Number,
        required: true
    },
    discountAmount:{
        type: Number,
        default : 0

    },
    offerAmount :{
        type: Number,
        default : 0
    },
    payment_method: {
        type: String,
        enum: ['UPI', 'Net Banking', 'COD','Razorpay','Wallet'],
        required: true
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed','Refunded'],
        default: 'Pending'

    },
    order_status: {
        type: String,
        enum: ['Pending','Dispatch', 'Shipped', 'Delivered', 'Canceled','Return','Pending Cancellation', 'Pending Return'],
        default: 'Pending'

    },
    shippingAddress: {
        addressDocId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
        },
        addressIndex: {
            type: Number,
        },
    },
    delivery_date: {
        type: Date,
        default: null
    },
    razorpay_order_id:{
        type : String
    },
    canceled_at: { 
        type: Date, 
        default: null,
    },
    cancellation_reason: { 
        predefined: { type: String }, 
        custom: { type: String } 
    },
    return_reason: {
        predefined: { type: String }, 
        custom: { type: String } 
    },
    restocked_at: {
        type: Date,
        default: null
    },
    admin_confirmation: { type: Boolean, default: false },

},{timestamps : true});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
