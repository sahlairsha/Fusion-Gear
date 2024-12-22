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
    isDeleted : {
        type : Boolean,
        default : false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    reviews: [
        {
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: { type: Number },
            review: { type: String }, 
            createdAt: { type: Date, default: Date.now },
        },
    ],
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
},{timestamps : true})


productSchema.virtual('status').get(function () {
    if (this.quantity > 0) {
        return "Available";
    } else if (this.quantity === 0) {
        return "Sold out" || "Out of stock";
    } else {
        return "Unavailable";
    }
});



const Product = mongoose.model("Product",productSchema)


module.exports = Product