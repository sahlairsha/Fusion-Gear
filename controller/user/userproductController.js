
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');


const loadProducts = async (req, res) => {
    try {

        let category = decodeURIComponent(req.query.category || '').trim();
        let { priceRange, size, color } = req.query; 
        let search = req.query.search ? req.query.search.trim() : "";
        let page = parseInt(req.query.page) || 1;
        const limit = 9;
        const sort = req.query.sort || "productName";
        const filters = {};

        let query = {
            isDeleted: false,
            isBlocked: false,
        };

        // Handle search query
        if (search) {
           
            const matchingCategory = await Category.findOne({
                name: { $regex: search, $options: 'i' },
            });

            query.$or = [
                { productName: { $regex: search, $options: 'i' } }, 
                { category: matchingCategory ? matchingCategory._id : null }, 
            ];
        }

        // Handle category filter (if explicitly selected)
        if (category) {
            const categoryData = await Category.findOne({
                name: { $regex: `^${category}$` , $options: 'i' }
            });
            if (categoryData) {
                filters.category = categoryData._id;
            }
        }

      
        if (size) {
            filters.size = size;
        }

      
        if (color) {
            filters.color = color;
        }

        
        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            filters.salePrice = { $gte: minPrice, $lte: maxPrice };
        }

        let sortQuery = {};

       
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
                sortQuery = { featured: -1, createdAt: -1};
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

        // Combine all filters with the base query
        Object.assign(query, filters);

        // Query for products with the applied filters and sorting
        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sortQuery)
            .exec();

        // Get the total count of products for pagination
        const count = await Product.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        const user = req.session.user ? await User.findById(req.session.user).lean(): null;

        if(!user){
           req.flash("error","Please Login!!");
           res.redirect('/')
        }

        const data = {
            products: productData,
            totalPages,
            totalProduct: count,
            limit,
            currentPage: page,
            sort,
            search,
            category,
            priceRange,
            size,
            color,
            user
        };


      
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

        await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

        // Fetch product details
        const productData = await Product.findById(id).populate('category').populate('reviews.user_id').exec();

        
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
            category: productData.category,
        });

    } catch (error) {
        console.error("Error loading product details page:", error.message);
        req.flash("error", "An error occurred while loading product details");
        res.redirect("/pagenotfound");
    }
};


const productRatings = async(req,res)=>{
    try{
        const { productId } = req.query;

        const productData = await Product.findById(productId).populate('category').populate('reviews.user_id').exec();


        const ratingCounts = [0, 0, 0, 0, 0]; 

         // Calculate the count for each star rating
       productData.reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingCounts[review.rating - 1] += 1; 
        }
      });

      const totalRatings = productData.reviews.length;
      const ratingPercentages = ratingCounts.map(count => (count / totalRatings) * 100);
      const averageRating = productData.ratings.average;

      res.json({
        totalRatings,
        ratingPercentages,
        counts: ratingCounts,
        averageRating
      })
    }catch(error){

        console.error(error);
        res.json({message : "There is a problem in fetching product ratings"})

    }
}





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
    getCoupon,
    productRatings

}