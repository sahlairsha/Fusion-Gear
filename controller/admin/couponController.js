const Coupon = require('../../models/couponSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');


const getCouponPage = async (req, res) => {

    try {
        const coupons = await Coupon.find();
        res.render( "coupon" , { coupons });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }

}

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
        const { code, discount, startDate, endDate, applicableTo, productId, categoryId, minOrderValue } = req.body;
        const coupon = new Coupon({
            code,
            discount,
            startDate,
            endDate,
            applicableTo,
            productId: applicableTo === 'product' ? productId : undefined,
            categoryId: applicableTo === 'category' ? categoryId : undefined,
            minOrderValue: applicableTo === 'order' ? minOrderValue : undefined,
        });

        await coupon.save();
        res.redirect('/admin/coupons'); 
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Error creating coupon' });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        await Coupon.findByIdAndDelete(couponId);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Error deleting coupon' });
    }
};


module.exports = {
    getCouponPage,
    addCoupon,
    getAddCouponPage,
    deleteCoupon
}