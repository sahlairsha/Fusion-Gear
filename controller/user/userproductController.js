
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
const ProductVariant = require("../../models/productVariantSchema");
const Coupon = require("../../models/couponSchema")

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
                name: { $regex: `^${category}$`, $options: 'i' }
            });
            if (categoryData) {
                filters.category = categoryData._id;
            }
        }

        // Handle product variant filters (size, color)
        let variantFilters = {};
        if (size) {
            variantFilters.size = { $regex: `^${size}$`, $options: 'i' };
        }
        
        if (color) {
            variantFilters.color = { $regex: `^${color}$`, $options: 'i' };
        }

        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            filters.salePrice = { $gte: minPrice, $lte: maxPrice };
        }

        let sortQuery = {};
        
        // Sorting options
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
                sortQuery = { featured: -1, createdAt: -1 };
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

        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sortQuery)
            .exec();

        // Query for the variants of the products (for filtering size/color)
        const productIds = productData.map(product => product._id);
        const variantsData = await ProductVariant.find({
            product_id: { $in: productIds },
            ...variantFilters
        }).exec();

        const productsWithVariants = await Promise.all(
            productData.map(async (product) => {
                const productVariants = await ProductVariant.findOne({ product_id: product._id });
                const firstVariant = productVariants && productVariants.variant.length > 0 ? productVariants.variant[0] : null;
                return {
                    ...product.toObject(),
                    variants: productVariants ? productVariants.variant : [],
                    firstVariant, 
                };
            })
        );
        


        // Get the total count of products for pagination
        const count = await Product.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        const user = req.session.user ? await User.findById(req.session.user).lean() : null;

        if (!user) {
            req.flash("error", "Please Login!!");
            res.redirect('/');
            return;
        }

        const data = {
            products: productsWithVariants, 
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
    
        const productData = await Product.findById(id).populate('category').populate('reviews.user_id').exec();
        if (!productData) {
            console.error(`Product not found with ID: ${id}`);
            req.flash("error", "Product not found");
            return res.redirect("/product/view");
        }
        
        // Attach variants to the product
        const productVariants = await ProductVariant.findOne({ product_id: productData._id });
        const productWithVariants = {
            ...productData.toObject(),
            variants: productVariants ? productVariants.variant : [],
        };
    
   
        

        const userData = req.session.user
            ? await User.findById(req.session.user).lean()
            : null;
        res.render("productlist", {
            user: userData,
            product:  productWithVariants,
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














module.exports = {
    loadProducts,
    loadProductsDetails,
    productRatings

}