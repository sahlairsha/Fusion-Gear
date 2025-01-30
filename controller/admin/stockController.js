const Product = require('../../models/productSchema');


const getStocks = async (req, res) => {
    try {
        const search = req.query.search || "";
        let page = parseInt(req.params.page, 10) || 1;
        let limit = 3;

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


       


        res.render('inventory', {
            products : productData ,
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
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, 'variants._id': variantId },
            {
                $inc: { 'variants.$.stock': stock },
                $set: { 'variants.$.status': stock > 0 ? 'Available' : 'Out of Stock' }
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: "Variant not found." });
        }

        res.status(200).json({ message: "Stock added successfully.", updatedProduct });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};


const reduceStock = async (req, res) => {
    const { productId, variantId } = req.params; 
    const { stock } = req.body; 

    if (stock <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    try {
        // Find the product and variant to validate stock before updating
        const product = await Product.findOne(
            { _id: productId, 'variants._id': variantId },
            { 'variants.$': 1 } // Fetch only the relevant variant
        );

        if (!product || !product.variants || product.variants.length === 0) {
            return res.status(404).json({ error: "Variant not found." });
        }

        const variant = product.variants[0]; // Only one variant is fetched
        if (variant.stock < stock) {
            return res.status(400).json({ error: "Insufficient stock available to reduce." });
        }

        // Proceed to update the stock and status
        const updatedProduct = await Product.findOneAndUpdate(
            { 
                _id: productId, 
                'variants._id': variantId 
            },
            {
                $inc: { 'variants.$.stock': -stock },
                $set: { 
                    'variants.$.status': variant.stock - stock > 0 ? 'Available' : 'Out of Stock' 
                }
            },
            { new: true } // Return the updated document
        );

        res.status(200).json({ message: "Stock reduced successfully.", updatedProduct });
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
