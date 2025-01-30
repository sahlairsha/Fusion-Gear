
const Product = require( "../../models/productSchema" );
const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
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
                query.category = categoryData._id;
            }
        }

        // Handle product variant filters (size, color)
        let variantFilters = {};
        if (size || color) {
            query.variants = { $elemMatch:{} };
            if (size) {
                query.variants.$elemMatch.size = { $regex: `^${size}$`, $options: 'i' };
            }
            if (color) {
                query.variants.$elemMatch.color = { $regex: `^${color}$`, $options: 'i' };
            }
        }
        

        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            query['variants.0.salePrice'] = { $gte: minPrice, $lte: maxPrice };
        }

        let sortQuery = {};
        
        // Sorting options
        switch (sort) {
            case 'popularity':
                sortQuery = { views: -1 };
                break;
            case 'priceLowToHigh':
                sortQuery = { 'variants.0.salePrice': 1 };
                break;
            case 'priceHighToLow':
                sortQuery = { 'variants.0.salePrice': -1 };
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

        if (req.query.clearCategory) category = '';
        if (req.query.clearPrice) priceRange = '';
        if (req.query.clearSize) size = '';
        if (req.query.clearColor) color = '';
        if (req.query.clearAll) {
            category = '';
            priceRange = '';
            size = '';
            color = '';
            search = '';
            sort = '';
        }
        

        
        // Combine all filters with the base query
        Object.assign(query, filters);

        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sortQuery)
            .exec();

            // Filter variants per product (size, color, price range)
const productsWithFilteredVariants = productData.map((product) => {
    const filteredVariants = product.variants.filter((variant) => {
        const matchSize = size && size !== "N/A" ? new RegExp(`^${size}$`, 'i').test(variant.size) : true;
        const matchColor = color ? new RegExp(`^${color}$`, 'i').test(variant.color) : true;
        const matchPrice = priceRange
            ? variant.salePrice >= parseInt(priceRange.split('-')[0]) &&
              variant.salePrice <= parseInt(priceRange.split('-')[1])
            : true;

        return matchSize && matchColor && matchPrice;
    });

    // Only return products with at least one matching variant
    if (filteredVariants.length > 0) {
        return {
            ...product.toObject(),
            variants: filteredVariants, // Attach only filtered variants
        };
    }
    return null; 
}).filter(product => product !== null); 


    
        
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
            products: productsWithFilteredVariants, 
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

        if (!id) {
            console.error("Product ID is missing");
            req.flash("error", "Product ID is required");
            return res.redirect("/pagenotfound");
        }

        await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

        const productData = await Product.findById(id)
            .populate('category')
            .populate('brands')
            .populate('reviews.user_id')
            .lean();

        if (!productData) {
            console.error(`Product not found with ID: ${id}`);
            req.flash("error", "Product not found");
            return res.redirect("/product/view");
        }

        // Calculate offer price
        productData.variants = productData.variants.map(variant => {
            const offerPrice = productData.offer?.discountPercentage
                ? Math.round(variant.salePrice * (1 - productData.offer.discountPercentage / 100))
                : variant.salePrice;

            return { ...variant, offerPrice };
        });

        // Fetch related products based on the same category or brand
        const relatedProducts = await Product.find({
            $or: [
                { category: productData.category._id },
                { brands: productData.brands._id }
            ],
            _id: { $ne: id }, // Exclude the current product
            isBlocked: false,
            isDeleted: false
        })
            .populate('category')
            .populate('brands')
            .limit(4)  
            .lean();
        const userData = req.session.user
            ? await User.findById(req.session.user).lean()
            : null;

        res.render("productlist", {
            user: userData,
            product: productData,
            category: productData.category,
            relatedProducts: relatedProducts
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