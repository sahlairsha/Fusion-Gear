const mongoose = require('mongoose');

const {Schema} = mongoose;


const categorySchema = new Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    isListed : {
        type : Boolean,
        default : true
    },
    categoryOffer : {
        type : Number,
        required : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const Category = mongoose.model("Category",categorySchema)


module.exports = Category