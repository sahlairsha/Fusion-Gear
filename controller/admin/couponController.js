const Coupon = require('../../models/couponSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const getCouponPage = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        const limit = 4;

        // Fetch coupons for the current page
        const coupons = await Coupon.find({})
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Coupon.countDocuments(); 
        const adminData = await User.findById(req.session.admin)
        res.render('coupon', { 
            coupons,
            totalPages: Math.ceil(count / limit),
            currentPage: page,     
            admin: adminData             
        });
        
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }
};


const getAddCouponPage = async (req, res) => {
    try {
        
        const products = await Product.find()
        const categories = await Category.find(); 
        
     
        // Render the form with products and categories
        const adminData = await User.findById(req.session.admin)
        res.render('add-coupon', { products, categories, admin : adminData });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Error fetching products or categories' });
    }
};

// POST route for adding a coupon
const addCoupon = async (req, res) => {
    try {
        const { 
            code, description, 
            discountType, discountValue, startDate,  endDate, 
            minOrderValue, usageLimit 
        } = req.body;

    
        let discount;
        if (discountType === 'percentage') {
            discount = discountValue; 
        } else if (discountType === 'fixed') {
            discount = discountValue;  
        }

        // Create the coupon
        const coupon = new Coupon({
            code,
            description: description || null,
            discountValue: discount,
            discountType,
            startDate,
            endDate,
            usageLimit,
            minOrderValue,
            status: 'active'
        });

        // Save the coupon to the database
        await coupon.save();
        res.redirect('/admin/coupons');
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error creating coupon' });
    }
};




const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const result = await Coupon.findByIdAndDelete(couponId);
        
        if (result) {
            res.json({ success: true, message: 'Coupon deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Coupon not found' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Error deleting coupon' });
    }
};


module.exports = {
    getCouponPage,
    addCoupon,
    getAddCouponPage,
    deleteCoupon
}