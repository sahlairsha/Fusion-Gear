const mongoose = require("mongoose");

const {Schema} = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },

    productOffer: {
        type: Number,
        default: 0,
    },
    productImage: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    views: {
        type: Number,
        default: 0,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    reviews: [
        {
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            rating: { type: Number },
            review: { type: String },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    
}, { timestamps: true });


const Product = mongoose.model("Product",productSchema)


module.exports = Product