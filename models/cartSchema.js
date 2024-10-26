const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema({
    userId : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    items : [{
        productId : {
            type : Schema.Types.ObjectId,
            ref : "Product",
            required : true
        },
        quantity:{
            type : Number,
            default : 1
        },
        price : {
            type : Number,
            required : true
        },
        status : {
            type : String,
            default : 'Placed'
        },
        cancellationReason : {
            type : String,
            default : "None"
        },


    }]
})

const Cart = moongoose.model("Cart",cartSchema)


module.exports = Cart