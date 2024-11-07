

const mongoose  = require("mongoose");

const {Schema} = mongoose;


const userSchema = new Schema({
    full_name :{
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
    isBlocked:{
        type : Boolean,
        default : false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    cart :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Cart"
    }],
    wallet : {
        type : Number,
        default : 0,
    },
    whishlist : [{
        type :mongoose.Schema.Types.ObjectId,
        ref : "Wishlist"
    }],
    orderHistory:[{
        type : mongoose.Schema.Types.ObjectId,
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
    }]
})



const User = mongoose.model("User",userSchema);

module.exports = User;