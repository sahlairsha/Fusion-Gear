const mongoose = require("mongoose");

const {Schema} = mongoose;

const productSchema = new Schema({
    productName :{
        type : String,
        required : true
    },
    description :{
        type : String,
        required : true
    },
    category :{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Category",
        required : true
    },
    regularPrice :{
        type :Number,
        required : true
    },
    salePrice : {
        type : Number,
        required : true
    },
    productOffer : {
        type : Number,
        default : 0
    },
    quantity:{
        type : Number,
        required : true
    },
    color : {
        type : [String],
        required : true
    },
    productImage : {
        type : [String],
        required : true
    },
    size :{
        type : [String],
        required : false
    },
    isBlocked :{
        type : Boolean,
        default : false
    },
    status :{
        type : String,
        enum : ["Available","Out Of Stock","Unavailable","Sold out"],
        required : true,
        default : "Available"
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    deletedAt: {
        type: Date,
        default: null
    }
},{timestamps : true})

const Product = mongoose.model("Product",productSchema)


module.exports = Product