const mongoose = require("mongoose");

const { Schema } = mongoose;

const productVariantSchema = new Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    variant : [ {

     color: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    regularPrice:{
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        required: false, 
    },
    status:{
        type: String,
        enum: ["Active", "Out of Stock", "Unavailable"],
        default: "Active"
    }
}]

});



const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
