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
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
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
    minOrderValue: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'inactive'],
        default: 'active',
    },
},{timestamp : true});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
