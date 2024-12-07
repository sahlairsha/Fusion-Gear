const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user_id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
        },
    products_id :[ {
        type : mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required: true
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
         shippingAddress: [{
            recipient_name: { type: String, required: true },
            streetAddress: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            phone: { type: String, required: true },
            addressType: { type: String, enum: ['Home', 'Work'], required: true },
        }],
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
