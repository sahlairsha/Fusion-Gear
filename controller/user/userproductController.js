
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema")


const loadProducts = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page);
        }

        const limit = 6;

        // Build query with optional search
        const query = {
            isDeleted: false, // Exclude soft-deleted products
            ...(search && { name: { $regex: search, $options: "i" } }),
        };

        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Product.find(query).countDocuments();

        const totalPages = Math.ceil(count / limit);

        const data = {
            products: productData,
            totalPages,
            totalProduct: count,
            limit,
            currentPage: page,
        };

        if (req.session.user) {
            const userData = await User.findById(req.session.user);
            data.user = userData;
        } else {
            data.user = null;
        }

        res.render("userproducts", data);
    } catch (error) {
        console.error("Error loading product page:", error);
        res.status(500).send("Server Error");
    }
};


const loadProductsDetails = async (req, res) => {
    try {
        const { id } = req.query;

        // Validate the product ID
        if (!id) {
            console.error("Product ID is missing");
            req.flash("error", "Product ID is required");
            return res.redirect("/pagenotfound");
        }

        // Fetch product details
        const productData = await Product.findById(id).populate('category').exec();

        if (!productData) {
            console.error(`Product not found with ID: ${id}`);
            req.flash("error", "Product not found");
            return res.redirect("/product/view");
        }

        const userData = req.session.user
            ? await User.findById(req.session.user).lean() 
            : null;
        res.render("productlist", {
            user: userData,
            product: productData,
            category: productData.category
        });

    } catch (error) {
        console.error("Error loading product details page:", error.message);
        req.flash("error", "An error occurred while loading product details");
        res.redirect("/pagenotfound");
    }
};

const submitRating = async (req, res) => {
    const { rating } = req.body;
    const product_id = req.query.id;
    const user_id = req.session.user; // Assuming session stores the user ID

    try {
        // Find the user and product
        const user = await User.findById(user_id);
        const product = await Product.findById(product_id);

        if (!user || !product) {
            return res.status(404).json({ message: 'User or Product not found' });
        }

        // Check if the user already rated this product
        const existingRating = user.ratedProducts.find(r => r.product_id.toString() === product_id);

        if (existingRating) {
            // Update existing rating
            const oldRating = existingRating.rating;
            existingRating.rating = rating;

            // Adjust product ratings
            const totalRatingValue = product.ratings.average * product.ratings.count;
            product.ratings.average = (totalRatingValue - oldRating + rating) / product.ratings.count;
        } else {
            // Add new rating
            user.ratedProducts.push({ product_id, rating });
            product.ratings.count += 1;

            const totalRatingValue = product.ratings.average * (product.ratings.count - 1) + rating;
            product.ratings.average = totalRatingValue / product.ratings.count;
        }

        // Save changes
        await user.save();
        await product.save();

        // Send the updated data back to the front-end
        return res.status(200).json({
            message: 'Rating submitted successfully',
            updatedRating: product.ratings.average,
            totalRatings: product.ratings.count
        });
    } catch (error) {
        console.error("Error submitting rating:", error);
        return res.status(500).json({ message: 'Error submitting rating', error });
    }
};


const getProductRatings = async (req, res) => {
    const { product_id } = req.params;

    try {
        // Find the product by ID
        const product = await Product.findById(product_id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const averageRating = product.ratings.average || 0;
        const totalRatings = product.ratings.count || 0;

        res.status(200).json({
            averageRating,
            totalRatings
        });
    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ message: 'Error fetching ratings', error });
    }
};
// Routes for rating
const rateProduct = (req, res) => {
    submitRating(req, res);
};

const coupons = [
    {
        code: "DISCOUNT10",
        discountType: "percentage",
        discountValue: 10,
        expiryDate: new Date("2024-12-31"),
        minimumPurchase: 500,
        usageLimit: 100,
        description: "Get 10% off on your purchase of &#8377;500 or more. Valid until December 31, 2024."
    },
    {
        code: "FLAT50",
        discountType: "fixed",
        discountValue: 50,
        expiryDate: new Date("2024-11-30"),
        minimumPurchase: 1000,
        usageLimit: 50,
        description: "Save &#8377;50 on your order of &#8377;1000 or more. Valid until November 30, 2024."
    }
];




const getCoupon = async(req,res)=>{
    try{
        res.json({ coupons });
    }catch(error){

        res.status(500).json({error : "Something Wrong to load the coupons" })
    }
}




const applyCoupon = async (req, res) => {
    const { code } = req.body;
    const productId = req.query.id;

   

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Find the matching coupon
        const coupon = coupons.find((c) => c.code === code);

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code.' });
        }

        if (coupon.expiryDate < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        if (coupon.minimumPurchase > product.salePrice) {
            return res.status(400).json({
                message: `Minimum purchase of ${coupon.minimumPurchase} required for this coupon.`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (product.salePrice * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'fixed') {
            discount = coupon.discountValue;
        }

        const discountedPrice = Math.max(0, product.salePrice - discount);

        res.status(200).json({
            message: 'Coupon applied successfully!',
            originalPrice: product.salePrice,
            discount,
            discountedPrice
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};




module.exports = {
    loadProducts,
    loadProductsDetails,
    rateProduct,
    getProductRatings,
    applyCoupon,
    getCoupon
}