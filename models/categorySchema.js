const mongoose = require('mongoose');

const {Schema} = mongoose;


const categorySchema = new Schema({
    name : {
        type : String,
        required : true,
        trim: true,
        lowercase: true, 
        validate: {
            validator: async function(value) {
                const existingCategory = await Category.findOne({
                    categoryName: value.toLowerCase()
                });
                if (existingCategory) {
                    throw new Error('Category name must be unique (case insensitive)');
                }
            },
            message: 'Category name must be unique (case insensitive)',
        }
    },
    description : {
        type : String,
        required : true
    },
    isListed : {
        type : Boolean,
        default : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    deletedAt : {
        type : Date,
        default : null
    }
})

categorySchema.index({ categoryName: 'text' });

const Category = mongoose.model("Category",categorySchema)


module.exports = Category