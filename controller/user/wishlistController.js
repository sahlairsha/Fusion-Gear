const Product = require('../../models/productSchema')
const ProductVariant = require('../../models/productVariantSchema');
const User = require('../../models/userSchema')


const getWhishlist = async(req,res)=>{
    try {
        const userId = req.session.user;
        const user = await User.findById(req.session.user).populate('wishlist.product_id')
        const whishlistItems = user.whishlist.filter(item => item.product_id);

        
        if (!userId) {
            req.flash("error", "Please login!!!");
            return res.redirect("/");
        }


         // Fetch the variants for each product in the cart
         for (let item of whishlistItems) {
            try {
                const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });

                if (productVariant && productVariant.variant.length > 0) {
                    // Get the first variant (or select a specific one if needed)
                    const variant = productVariant.variant[0];  // Picking the first variant as default

                    // Add variant data to the cart item
                    item.variant = variant;
                    item.salePrice = variant.salePrice || variant.regularPrice;  // Use salePrice or fallback to regularPrice
                } else {
                    console.log(`No variants found for product ${item.product_id._id}`);
                }
            } catch (variantError) {
                console.error('Error fetching product variant:', variantError);
            }
        }

        res.render("wishlist",{
            user,
            whishlistItems,
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}


const addToWhishlist = async (req,res)=> {
    try {
        const { productId } = req.params;
        const userId = req.session.user;

        
        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

       
        const user = await User.findOne({ _id: userId });

        
        const existingItem = user.whishlist.find(item => item.product_id.toString() === productId);

        if (existingItem) {
            return res.json({ success: false, message: 'Product already in whishlist' });
        }
            
            await User.findByIdAndUpdate(
                userId,
                { $push: { whishlist: { product_id: productId} } },
                { new: true }
            );
        

        res.json({ success: true, message: 'Product added to cart' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
}



module.exports = {
    getWhishlist,
    addToWhishlist
}