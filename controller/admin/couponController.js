const Coupon = require('../../models/couponSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

const getCouponPage = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('productId categoryId');
        res.render('coupon', { coupons });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }
};


const getAddCouponPage = async (req, res) => {
    try {
        
        const products = await Product.find()
        const categories = await Category.find(); 
        
     
        // Render the form with products and categories
        res.render('add-coupon', { products, categories });
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
            discountType, discountValue, startDate, applicableTo, endDate, 
            productId, categoryId, minOrderValue, usageLimit 
        } = req.body;

        // Determine the final discount value based on the discount type
        let discount;
        if (discountType === 'percentage') {
            discount = discountValue;  // percentage value
        } else if (discountType === 'fixed') {
            discount = discountValue;  // fixed amount value
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
            applicableTo,  // Use applicableTo instead of applicableScope
            productId: applicableTo === 'product' ? productId : undefined,
            categoryId: applicableTo === 'category' ? categoryId : undefined,
            minOrderValue: applicableTo === 'order' ? minOrderValue : undefined,
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