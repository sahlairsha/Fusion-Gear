// Admin Controller (controllers/admin.js)
const Offer = require('../../models/offerSchema');


const getOfferPage = async(req, res) =>{
    try{
        const offers = await Offer.find();
        res.render('offers',{offers});
    }catch(e){
        console.log(e);
        res.status(500).json({ message: 'Error retrieving offers' });
    }
}

const getOfferCreate = async(req,res)=>{
    try{
        res.render('add-offer');
    }catch(e){
        console.log(e);
        res.status(500).json({ message: 'Error retrieving offer creation form' });
    }
}


const createProductOffer = async (req, res) => {
    const { productName, discountPercentage, startDate, endDate } = req.body;

    console.log("Starting date:",startDate)
    
    const offer = new Offer({
        type: 'Product',
        productName,
        discount: discountPercentage,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    });
    await offer.save();
    req.flash('success',"The product Offer has been  added successfully")
    res.redirect('/admin/add-offer');
};

const createCategoryOffer = async (req, res) => {
    const { categoryName, categoryDiscount, startDate, endDate } = req.body;
    const offer = new Offer({
        type: 'Category',
        categoryName,
        discount: categoryDiscount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    });
    await offer.save();
    req.flash('success',"The category Offer has been  added successfully")
    res.redirect('/admin/add-offer');
};

const createReferralOffer = async (req, res) => {
    try{
        const { referralCode, rewardAmount, expiryDate } = req.body;
    const offer = new Offer({
        type: 'Referral',
        referralCode,
        rewardAmount,
        startDate: new Date(),
        endDate: new Date(expiryDate)
    });
    await offer.save();
    req.flash('success',"The referral Offer has been  added successfully")
    res.redirect('/admin/add-offer');

    }catch(error){
        console.log(error)
        req.flash("error" , 'Internal Server Error' );
        res.redirect('/admin/add-offer');
    }
};




const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id;  // Get offer ID from the URL
        await Offer.findByIdAndDelete(offerId);  // Delete the offer from the database
        res.json({ success: true });  // Send a success response
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Error deleting offer' });
    }
};



module.exports = {
    getOfferPage, 
    getOfferCreate,
    createProductOffer, 
    createCategoryOffer, 
    createReferralOffer,
    deleteOffer
 };
