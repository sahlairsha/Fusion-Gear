const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin/adminController');
const adminAuth  = require('../middleware/adminAuth');

const customerController = require('../controller/admin/customerController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const orderController = require('../controller/admin/orderController')

const multer = require('multer');
const { storage, editedStorage } = require("../helper/multer");

const uploads = multer({ storage }); // For original images
const editUploads = multer({ storage: editedStorage }); 

// Admin login & logout
router.get('/admin/login', adminController.loadLogin);
router.post('/admin/login', adminController.login);
router.get('/admin/logout', adminController.logout);

router.get('/admin_profile',adminAuth,adminController.getProfile)

// Dashboard
router.get('/admin/dashboard', adminAuth, adminController.loadDashboard);

// Customer management
router.get('/admin/users', adminAuth, customerController.customerInfo);
router.get('/admin/blockedUser', adminAuth, customerController.blockedUser);
router.get('/admin/unblockedUser', adminAuth, customerController.unblockedUser);


// Category management
router.get('/admin/category', adminAuth, categoryController.categoryInfo);
router.get('/admin/addcategory', adminAuth, categoryController.inputCategories);
router.post('/admin/addcategory', adminAuth, categoryController.addCategories);
router.put('/admin/editcategory', adminAuth, categoryController.editCategories);
router.get('/admin/deletecategory', adminAuth, categoryController.deleteCategories);
router.get('/admin/restorecategory', adminAuth, categoryController.restoreCategories);

// Product management
router.get('/admin/add-products', adminAuth, productController.getProduct);
router.post('/admin/add-products', adminAuth, uploads.array("image", 4), productController.addProducts);
router.get("/admin/products", adminAuth, productController.getAllProducts);
router.get("/admin/editproducts", adminAuth, productController.getEditProducts);
router.post("/admin/editproducts/:id", adminAuth, editUploads.array("image", 4), productController.editProducts);
router.post("/deleteImage", adminAuth, productController.deleteImage);
router.get("/admin/deleteproducts", adminAuth, productController.deleteProducts);
router.get("/admin/restoreproducts", adminAuth, productController.restoreProduct);

router.get('/admin/blockedproduct', adminAuth, productController.blockProducts);
router.get('/admin/unblockedproduct', adminAuth, productController.unblockProducts);


// Order Management 

router.get('/admin/orders', adminAuth ,orderController.getOrders)

router.post('/admin/orders/:id/status', adminAuth, orderController.changeOrderStatus);







// Error Page
router.get('/pageerror', adminController.pageerror);

module.exports = router;
