const mongoose = require("mongoose");

const { Schema } = mongoose;

const productVariantSchema = new Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
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
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        required: false,
    },
    status: {
        type: String,
        enum: ["Available", "Out of Stock", "Unavailable"],
        default: "Available",
    },
}, { timestamps: true });


// Pre-save hook to validate and set the correct status based on stock
productVariantSchema.pre('save', function (next) {
    if (this.stock === 0) {
        this.status = "Out of Stock";
    } else if (this.stock < 0) {
        this.status = "Unavailable";
    } else {
        this.status = "Available";
    }
    next();
});

productVariantSchema.post('findOneAndUpdate', async function (doc) {
    if (doc) {
        // Update the status based on stock
        if (doc.stock === 0) {
            doc.status = "Out of Stock";
        } else if (doc.stock < 0) {
            doc.status = "Unavailable";
        } else {
            doc.status = "Available";
        }

        await doc.save();
    }
});


const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
