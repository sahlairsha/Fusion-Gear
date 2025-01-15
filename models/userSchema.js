

const mongoose  = require("mongoose");

const {Schema} = mongoose;


const userSchema = new Schema({
    full_name : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : false,
        unique : true,
        sparse : true,
        default : null
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : String,
        required : false,
        unique : true,
        sparse : true,
        default : null
    },
    googleId : {
        type : String,
        unique : true,
        sparse : true
    },
    password : {
        type : String,
        required : false,
    },
    profile_pic : {
        type : String,
        default: ''
    },
    isBlocked:{
        type : Boolean,
        default : false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    cart :[{
       product_id: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
       },
       variant_id: {
        type: mongoose.Schema.Types.ObjectId
    },
       quantity:{
        type : Number,
       }
    }],
    wallet : {
        type : Number,
        default : 0,
    },
    transactions: [{
        type: {
            type: String, 
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    }],
    wishlist : [{
        product_id :{
        type :mongoose.Schema.Types.ObjectId,
        ref : "Product",

        },
        variant_id: { type: mongoose.Schema.Types.ObjectId }

        
    }],
    orderHistory:[{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Order"
    }],
    createdOn : {
        type : Date,
        default : Date.now
    },
    referralCode : {
        type : String,
         unique: true
    },
    redeemed : {
        type : Boolean
    },
    redeemedUser : [{
        type : mongoose.Schema.Types.ObjectId,
        ref :"User"
    }],
    serachHistroy:[{
        category : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Category"
        },
        brand : {
            type : String
        },
        serachOn : {
            type : Date,
            default : Date.now
        }
    }],
    ratedProducts: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            rating: { type: Number },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    resetToken:{
        type : String,
        default : ''
    },
    resetTokenExpiry:{
        type : Date,
        default: Date.now
    }

})



const User = mongoose.model( "User" , userSchema);

module.exports = User;