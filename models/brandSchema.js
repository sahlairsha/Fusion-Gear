
const mongoose = require('mongoose');

const { Schema } = mongoose;


const brandSchema = new mongoose.Schema({
    brand_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    logo: {
        type: String,
    },
    totalSales: {
        type: Number,
        default: 0,
    },
    isDeleted: {
        type: Boolean,
        default: false,
     },
     deletedAt:{
        type:Date,
        default:null
     },
     },
      {
    timestamps: true 
});

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;
