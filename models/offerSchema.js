const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    type: 
    { 
        type: String,
         required: true, 
         enum: ['Product', 'Category', 'Referral'] 
    },
    productName: String,
    categoryName: String,
    discount: Number,
    referralCode: String,
    rewardAmount: Number,
    startDate: { type: Date },
    endDate: { type: Date}
});
const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer