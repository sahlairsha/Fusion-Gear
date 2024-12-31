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
        enum: ["Available", "Out of Stock", "Unavailable"],
        default: "Available"
    }
}]

});


// Pre-save hook to validate and set the correct status based on stock
productVariantSchema.pre('save', function (next) {
    this.variant.forEach((v) => {
        if (v.stock === 0) {
            v.status = "Out of Stock";
        } else if (v.stock < 0) {
            v.status = "Unavailable";
        } else {
            v.status = "Available";
        }
    });
    next();
});

productVariantSchema.post('findOneAndUpdate', async function (doc) {
    // Iterate over the variants and update the status based on stock after the update
    if (doc && doc.variant) {
        doc.variant.forEach((v) => {
            if (v.stock === 0) {
                v.status = "Out of Stock";
            } else if (v.stock < 0) {
                v.status = "Unavailable";
            } else {
                v.status = "Available";
            }
        });

        // Save the document after status update
        await doc.save();
    }
});
const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
