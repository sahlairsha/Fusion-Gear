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
    payment_method: {
        type: String,
        enum: ['UPI', 'Net Banking', 'COD'],
        required: true
    },
    payment_status: {

        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'

    },
    order_status: {

        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Canceled'],
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
    canceled_at: { 
        type: Date, 
        default: null,
    },
    cancellation_reason: { 
        predefined: { type: String }, 
        custom: { type: String } 
    }

},{timestamps : true});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
