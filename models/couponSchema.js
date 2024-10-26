const mongoose = require('mongoose');

const {Schema} = mongoose;

const couponSchema = new Schema({
    name : {
        type : String,
        requires : true,
        unique : true
    },
    createdOn : {
        type : Date,
        default : Date.now,
        required : true
    },
    expireOn : {
        type : Date,
        required : true
    },

    offerPrice : {
        type : Number,
        required  : true
    },
    minimunPrice : {
        type : Number,
        required : true
    },

    isList : {
        type : Boolean,
        default : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    }
})


const Coupon = mongoose.model("Coupon",couponSchema);

module.exports = Coupon