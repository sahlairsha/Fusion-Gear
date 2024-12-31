const Product = require('../../models/productSchema');
const ProductVariant = require('../../models/productVariantSchema')

const getStocks = async (req, res) => {
    try {
        const search = req.query.search || "";
        let page = parseInt(req.params.page, 10) || 1;
        let limit = 6;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*") } }
            ],
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('category', 'name')
        .exec();

        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*") } }
            ]
        }).countDocuments();

        const productsWithVariants = await Promise.all(
            productData.map(async (product) => {
                const productVariants = await ProductVariant.findOne({ product_id: product._id });
                return {
                    ...product.toObject(),
                    variants: productVariants ? productVariants.variant : [],
                };
            })
        );

        res.render('inventory', {
            products:  productsWithVariants,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const addStock = async (req, res) => {
    const { productId, variantId } = req.params;
    const { stock } = req.body;

    if (stock <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    try {
        // Find the variant by its ID and update the stock
        const variant = await ProductVariant.findOneAndUpdate(
            { 
                product_id: productId, 
                'variant._id': variantId 
            },
            {
                $inc: { 'variant.$.stock': stock }  // Increment the stock for the specific variant
            },
            { new: true }  // Return the updated document
        );

        // Check if the variant was found and updated
        if (!variant) {
            return res.status(404).json({ error: "Variant not found." });
        }

        res.status(200).json({ message: "Stock added successfully.", variant });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};

const reduceStock = async (req, res) => {
    const { productId, variantId } = req.params; // Use variantId to identify which variant to update
    const { stock } = req.body; // Quantity to reduce

    if (stock <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    try {
        // Find the variant by its ID
        // Find the variant by its ID and update the stock
        const variant = await ProductVariant.findOneAndUpdate(
            { 
                product_id: productId, 
                'variant._id': variantId 
            },
            {
                $inc: { 'variant.$.stock': -stock }  // Increment the stock for the specific variant
            },
            { new: true }  // Return the updated document
        );
        if (!variant) {
            return res.status(404).json({ error: "Variant not found." });
        }

       
        await variant.save();

        res.status(200).json({ message: "Stock reduced successfully.", variant });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};


const getLowStockProducts = async (req, res) => {
    const { threshold } = req.query;
    const stockThreshold = threshold ? parseInt(threshold, 10) : 10;

    try {
        const products = await Product.find({ 'variants.stock': { $lt: stockThreshold }, isDeleted: false });
        res.status(200).json({ message: "Low stock products retrieved.", products });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};

const blockedStock = async(req,res)=>{
    try {
        let id = req.query.id;
        await Product.updateOne({_id :id},{$set : {isBlocked : true}})
        res.redirect('/admin/stock')
    } catch (error) {
        console.log('Error in blocking user',error)
        res.redirect('/pageerror')
    }
}

const unblockedStock = async(req,res)=>{
    try {
        let id = req.query.id;
        await Product.updateOne({_id : id},{$set : {isBlocked : false}})
        res.redirect('/admin/stock')
    } catch (error) {
        console.log('Error in blocking user',error)
        res.redirect('/pageerror')
    }
}

module.exports = {
    getStocks,
    addStock,
    reduceStock,
    getLowStockProducts,
    blockedStock,
    unblockedStock
 };
