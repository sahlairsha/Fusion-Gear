const mongoose = require('mongoose');

const {Schema} = mongoose;

const cartSchema = new Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    items:[{
        product_id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Product",
            required : true
        }
    }],
    gross_amount : {
        type : Number,
        required : true
    },
    total_amount : {
        type : Number,
        required : true
    },
    discount_amount : {
        type : Number,
        required : false
    },
    net_amount : {
        type : Number,
        required : true
    },
    shipping_fee : {
        type : Number,
        required : true
    }
},{timestamps : true})


const Cart = mongoose.model("Cart",cartSchema);

module.exports = Cart;