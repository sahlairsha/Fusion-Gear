const mongoose = require('mongoose');

const {Schema} = mongoose;

const addressSchema = new Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    address:[{

        recipient_name:{
            type : String,
            required : true
        },
        streetAddress:{
            type : String,
            required : true
        },
        city : {
            type : String,
            required: true
        },
        state:{
            type:String,
            required : true
        },
        landMark:{
            type:String,
            required : false
        },
        pincode:{
            type : String,
            required : true
        },
        addressType:{
            type : String,
            enum : ['Home','Work'],
            required : true
        },
        phone:{

            type : String,
            required : true

        },
        altPhone : {
            type : String,
            required : false
        }
       
    }]
})


const Address = mongoose.model("Address",addressSchema);

module.exports = Address;