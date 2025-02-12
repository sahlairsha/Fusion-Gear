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

  // A. Get Top Products
  async function getTopProducts(startDate, endDate,timeRange) {
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
  
    const topProducts = await Order.aggregate([
      { $match: matchCriteria },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",            
          localField: "products.product_id",
          foreignField: "_id",
          as: "productData"
        }
      },
      { $unwind: "$productData" },
      {
        $group: {
          _id: "$productData._id",
          name: { $first: "$productData.productName" },
          totalSales: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
  
    return topProducts;
  }
  
  // B. Get Top Brands
  async function getTopBrands(startDate, endDate,timeRange) {
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
  
    const topBrands = await Order.aggregate([
      { $match: matchCriteria },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product_id",
          foreignField: "_id",
          as: "productData"
        }
      },
      { $unwind: "$productData" },
      {
        $lookup: {
          from: "brands",             
          localField: "productData.brands", 
          foreignField: "_id",
          as: "brandData"
        }
      },
      { $unwind: "$brandData" },
      {
        $group: {
          _id: "$brandData._id",
          name: { $first: "$brandData.brand_name" },
          totalSales: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
  
    return topBrands;
  }
  
  // C. Get Top Categories
  async function getTopCategories(startDate, endDate,timeRange) {
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
  
    const topCategories = await Order.aggregate([
      { $match: matchCriteria },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product_id",
          foreignField: "_id",
          as: "productData"
        }
      },
      { $unwind: "$productData" },
      {
        $lookup: {
          from: "categories",        
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$categoryData._id",
          name: { $first: "$categoryData.name" },
          totalSales: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
  
    return topCategories;
  }


const topProducts = async (req, res) => {
    const { timeRange, startDate, endDate } = req.query;
    try {
        const topProducts = await getTopProducts(startDate, endDate,timeRange);
        res.json(topProducts);
    } catch (error) {
        console.error("Error fetching top products:", error);
        res.status(500).json({ message: "Error fetching top products" });
    }
};


const topCategories = async (req, res) => {
    const { timeRange, startDate, endDate } = req.query;
    try {
        const topCategories = await getTopCategories(startDate, endDate,timeRange);
        res.json(topCategories);
    } catch (error) {
        console.error("Error fetching top category:", error);
        res.status(500).json({ message: "Error fetching top categories" });
    }
};



const topBrands = async (req, res) => {
    const { timeRange, startDate, endDate } = req.query;
    try {
        const topBrands = await getTopBrands(startDate, endDate,timeRange);
        console.log("Top brands:",topBrands)
        res.json(topBrands);
    } catch (error) {
        console.error("Error fetching top brand:", error);
        res.status(500).json({ message: "Error fetching top brand" });
    }
};


module.exports={
    topProducts,
    topCategories,
    topBrands
}