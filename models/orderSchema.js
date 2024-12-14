const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product_id : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        } ,
        quantity: {
            type: Number,
            default : 0
        },
    }],
    total_price: {
        type: Number,
        required: true
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
    order_date: {
        type: Date,
        default: Date.now
    },
    shippingAddress: 
        {
            address_id:{
             type: mongoose.Schema.Types.ObjectId, 
             ref: 'Address' 
            }
             
        },
        delivery_date: {
            type: Date,
            default: null
        }

});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
