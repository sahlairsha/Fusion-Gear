const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: async function (value) {
              
                const existingCategory = await this.constructor.findOne({
                    name: { $regex: `^${value}$`, $options: 'i' },
                });

            
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
    categoryDiscount: {
        percentage:{
            type: Number,
            default: 0,

        },
        startDate:{
            type: Date
        },
        endDate:{
            type: Date
        },
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
