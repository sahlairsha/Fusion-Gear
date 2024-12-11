const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: async function (value) {
                // Use `this.constructor` to perform the case-insensitive check
                const existingCategory = await this.constructor.findOne({
                    name: { $regex: `^${value}$`, $options: 'i' },
                });

                // If a matching category exists and it's not the same document, throw an error
                if (existingCategory && existingCategory._id.toString() !== this._id.toString()) {
                    return false; 
                }

                return true;
            },
            message: 'Category name must be unique (case insensitive)',
        },
    },
    description: {
        type: String,
        required: true,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
});

// Create the model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
