

const mongoose  = require("mongoose");

const {Schema} = mongoose;


const userSchema = new Schema({
    fullName :{
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true,
        unique : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : String,
        required : true,
        unique : true,
        sparse : true,
        default : null
    },
    googleId : {
        type : String,
        unique : true
    },
    password : {
        type : String,
        required : false,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
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
        type : Schema.Types.ObjectId,
        ref : "Cart"
    }],
    wallet : {
        type : Number,
        default : 0,
    },
    whishlist : [{
        type : Schema.Types.ObjectId,
        ref : "Wishlist"
    }],
    orderHistory:[{
        type : Schema.Types.ObjectId,
        ref : "Order"
    }],
    createdOn : {
        type : Date,
        default : Date.now
    },
    referalCode : {
        type : String,
    },
    redeemed : {
        type : Boolean
    },
    redeemedUser : [{
        type :Schema.Types.ObjectId,
        ref :"User"
    }],
    serachHistroy:[{
        category : {
            type : Schema.Types.ObjectId,
            ref : "Category"
        },
        brand : {
            type : String
        },
        serachOn : {
            type : Date,
            default : Date.now
        }
    }]
})



const User = mongoose.model("User",userSchema);

module.exports = User