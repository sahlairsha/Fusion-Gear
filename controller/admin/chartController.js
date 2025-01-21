// const moment = require('moment');
const Product = require('../..//models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const Order = require('../../models/orderSchema');

const dayjs = require('dayjs');

function filterOrdersByDate(startDate, endDate) {
    return {
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        }
    };
}


// Helper function to fetch data for top sellers (products, categories, or brands)
async function getTopSellers(collection, field, timeRange, startDate, endDate) {
    let matchCriteria = {};

    if (timeRange === "custom" && startDate && endDate) {
        startDate = dayjs(startDate).startOf("day").toDate();
        endDate = dayjs(endDate).endOf("day").toDate();
        matchCriteria = filterOrdersByDate(startDate, endDate);
    } else {
        startDate = dayjs().startOf(timeRange).toDate();
        endDate = dayjs().endOf(timeRange).toDate();
        matchCriteria = filterOrdersByDate(startDate, endDate);
    }

    const nameField = {
        products: "productName",
        categories: "name",
        brands: "brand_name",
    };

    const topSellers = await Order.aggregate([
        { $match: matchCriteria },
        { $unwind: "$products" },
        {
            $lookup: {
                from: collection, // Products, Categories, or Brands collection
                localField: `products.${field}`, // e.g., products.product_id
                foreignField: "_id", // e.g., _id in Products collection
                as: field, 
            },
        },
        { $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: `$products.${field}._id`, // Group by ID
                name: { $first: `$${field}.${nameField[collection]}` }, // Get the correct name field
                totalSales: { $sum: "$products.quantity" },
            },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
    ]);

    return topSellers;
}



const topProducts = async(req,res)=>{
    const { timeRange, startDate, endDate } = req.query;

    try {
        const topProducts = await getTopSellers("products", "product_id", timeRange, startDate, endDate);
        res.json(topProducts);
    } catch (error) {
        console.error("Error fetching top products:", error);
        res.status(500).json({ message: "Error fetching top products" });
    }
}


const topCategories = async(req,res)=>{
    const { timeRange, startDate, endDate } = req.query;
    try {
        const topCategories = await getTopSellers('Category', 'category', timeRange, startDate, endDate);
        res.json(topCategories);
    } catch (error) {
        console.error("Error fetching top category:", error);
        res.status(500).json({ message: "Error fetching top categories" });
    }
}


const topBrands = async(req,res) => {
    const { timeRange, startDate, endDate } = req.query;
    try {
        const topBrands = await getTopSellers('Brand', 'brands', timeRange, startDate, endDate);
        res.json(topBrands);
    } catch (error) {
        console.error("Error fetching top brand:", error);
        res.status(500).json({ message: "Error fetching top brand" });
    }
}


module.exports={
    topProducts,
    topCategories,
    topBrands
}