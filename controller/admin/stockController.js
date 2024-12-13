const Product = require('../../models/productSchema');


const getStocks = async(req,res)=>{
    try{

        const search = req.query.search || ""; 
        let page = parseInt(req.params.page,10) || 1;

        let limit = 6;


        const productData = await Product.find(
            {
                $or : [
                    { productName : { $regex : new RegExp(".*" + search + ".*")}}
                ],
            })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('category','name')
            .exec();
            const count = await Product.find({
                $or : [
                    { productName: { $regex: new RegExp(".*" + search + ".*") } }
                ]
            }).countDocuments();

        res.render('inventory',{
            products : productData,
            totalPages : Math.ceil(count/limit),
            currentPage: page
        });
    }catch(err){
        res.status(500).json({message:"Internal Server Error"});
    }
}

const addStock = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    try {
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            return res.status(404).json({ error: "Product not found." });
        }

        product.quantity += quantity;
        await product.save();

        res.status(200).json({ message: "Stock added successfully.", product });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};

const reduceStock = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body; // Quantity to reduce

    if (quantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    try {
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            return res.status(404).json({ error: "Product not found." });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock." });
        }

        product.quantity -= quantity;
        await product.save();

        res.status(200).json({ message: "Stock reduced successfully.", product });
    } catch (err) {
        res.status(500).json({ error: "Internal server error.", details: err.message });
    }
};

const getLowStockProducts = async (req, res) => {
    const { threshold } = req.query;
    const stockThreshold = threshold ? parseInt(threshold, 10) : 10;

    try {
        const products = await Product.find({ quantity: { $lt: stockThreshold }, isDeleted: false });
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
