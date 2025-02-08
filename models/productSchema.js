const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    brands:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required : true
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
    offer: {
        discountPercentage: { 
            type: Number,
            default: 0 
        },
        startDate: Date,
        endDate: Date,
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
    variants: [
        {
            color: { type: String },
            size: { type: String },
            stock: { type: Number, required: true, default: 0 },
            regularPrice: { type: Number, required: true },
            salePrice: { type: Number, required: false },
            status: {
                type: String,
                enum: ["Available", "Out of Stock", "Unavailable"],
                default: "Available",
            },
        }
    ],
}, { timestamps: true });



productSchema.pre('save', function (next) {
    this.variants.forEach(variant => {
        if (variant.stock > 0) {
            variant.status = "Available";
        } else if (variant.stock === 0) {
            variant.status = "Out of Stock";
        } else {
            variant.status = "Unavailable";
        }
    });
    next();
});



const Product = mongoose.model("Product", productSchema);

module.exports = Product;