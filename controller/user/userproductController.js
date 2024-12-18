
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const loadProducts = async (req, res) => {
    try {
        let search = req.query.search ? req.query.search.trim() : "";
        let page = parseInt(req.query.page) || 1;
        const limit = 9;
        const sort = req.query.sort || "productName"; // Default sort by productName

        let query = {
            isDeleted: false,
            isBlocked: false,
        };
        
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        let sortQuery = {};
        
        // Sorting logic based on selected option
        switch (sort) {
            case 'popularity':
                sortQuery = { views: -1 };
                break;
            case 'priceLowToHigh':
                sortQuery = { salePrice: 1 };
                break;
            case 'priceHighToLow':
                sortQuery = { salePrice: -1 };
                break;
            case 'averageRating':
                sortQuery = { 'ratings.average': -1 };
                break;
            case 'featured':
                sortQuery = { featured: -1 };
                break;
            case 'newArrivals':
                sortQuery = { createdAt: -1 };
                break;
            case 'aToZ':
                sortQuery = { productName: 1 };
                break;
            case 'zToA':
                sortQuery = { productName: -1 };
                break;
            default:
                sortQuery = { [sort]: 1 };
                break;
        }

        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sortQuery)
            .exec();

        const count = await Product.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        const data = {
            products: productData,
            totalPages,
            totalProduct: count,
            limit,
            currentPage: page,
            sort,
            search
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












module.exports = {
    loadProducts,
    loadProductsDetails,
    getCoupon
}