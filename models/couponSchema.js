const mongoose = require('mongoose');

const {Schema} = mongoose

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description:{
        type : String
    },
    discount: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    usageLimit: {
        type: Number,
        required: true,
        default: 1,
    },
    timesUsed: {
        type: Number,
        default: 0,
    },
    applicableTo: {
        type: String,
        enum: ['product', 'category', 'order'],  // Defines if coupon applies to product, category, or whole order
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',  // Only used if applicableTo is 'product'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  // Only used if applicableTo is 'category'
    },
    minOrderValue: {
        type: Number,  // Only used if applicableTo is 'order'
    },
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
