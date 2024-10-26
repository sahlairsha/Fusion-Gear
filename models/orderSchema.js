const mongoose = require("mongoose");

const { Schema } = mongoose;

const { v4:uuid } = require("uuid")


const orderSchema = new Schema({
    orderId : {
        type : String,
        default : () =>uuid.v4(),
        required : true,
        unique : true
    },
    orderedItems : [{
        product : {
            type : Schema.Types.ObjectId,
            ref : 'Product',
            required : true
        },
        quantity : {
            type: Number,
            default : 1,
            required : true
        },
        price : {
            type : Number ,
            default : 0
        }
    }],
    totalPrice : {
        type : Number,
        required : true
    },
    discount : {
        type : Number,
        default : 0
    },
    finalAmount : {
        type : Number,
        required : true
    },
    address : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    invoiceDate : {
        type : Date,
        default : Date.now
    },
    status : {
        type : String,
        enum : ['Pending','Proccesing','Shipped','Delivered','Cancelled','Return Request','Returned'],
    },
    createdOn : {
        type : Date,
        default : Date.now,
        required : true
    },
    couponApplied : {
        type : Boolean,
        default : false
    }
})


const Order = mongoose.model('Order');

module.exports = Order