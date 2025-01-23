const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin/adminController');
const adminAuth  = require('../middleware/adminAuth');

const customerController = require('../controller/admin/customerController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const orderController = require('../controller/admin/orderController')
const stockController = require('../controller/admin/stockController')
const couponController = require('../controller/admin/couponController')
const brandController = require('../controller/admin/brandController')
const chartController = require('../controller/admin/chartController')



const multer = require('multer');
const { storage, editedStorage } = require("../helper/multer");

const logoUpload = require('../helper/logoUpload');

const{logoStorage} = logoUpload
const upload = multer({ storage: logoStorage });


const uploads = multer({ storage });
const editUploads = multer({ storage: editedStorage }); 

// Admin login & logout
router.get('/admin/login', adminController.loadLogin);
router.post('/admin/login', adminController.login);
router.get('/admin/logout', adminController.logout);

router.get('/admin_profile',adminAuth,adminController.getProfile)

// Dashboard
router.get('/admin/dashboard', adminAuth, adminController.loadDashboard);
router.post('/generate-report', adminAuth, adminController.generateReport);
router.get('/download-pdf',adminAuth , adminController.downloadPdf);
router.get('/download-excel',adminAuth, adminController.downloadExcel)


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
router.post('/admin/add-products',adminAuth, uploads.array("image", 4),productController.addProducts);
router.get("/admin/products", adminAuth, productController.getAllProducts);
router.get("/admin/editproducts", adminAuth, productController.getEditProducts);
router.post("/admin/editproducts/:id", adminAuth, editUploads.array("image", 4), productController.editProducts);
router.post("/deleteImage", adminAuth, productController.deleteImage);
router.get("/admin/deleteproducts", adminAuth, productController.deleteProducts);
router.get("/admin/restoreproducts", adminAuth, productController.restoreProduct);
router.get('/admin/product-details/:id',adminAuth,productController.getProductDetails)
router.delete('/admin/remove-variant/:productId/:variantIndex',adminAuth,productController.removeVariant)

router.get('/admin/blockedproduct', adminAuth, productController.blockProducts);
router.get('/admin/unblockedproduct', adminAuth, productController.unblockProducts);



// Order Management 

router.get('/admin/orders', adminAuth ,orderController.getOrders)
router.post('/admin/orders/:id/status', adminAuth, orderController.changeOrderStatus);
router.get('/admin/order-details/:id',adminAuth, orderController.getDetails)
router.post('/admin/cancel-order/:orderId',adminAuth,orderController.adminCancelOrder)



// Stock Management
router.put("/stock/add/:productId/:variantId",adminAuth,stockController.addStock);
router.put("/stock/reduce/:productId/:variantId",adminAuth,stockController.reduceStock);
router.get('/admin/blockStock', adminAuth, stockController.blockedStock);
router.get('/admin/unblockStock', adminAuth, stockController.unblockedStock)



//Stock Management
router.get('/admin/stock',adminAuth, stockController.getStocks)


//Coupon mangament

router.get('/admin/coupons',adminAuth, couponController.getCouponPage)
router.get('/admin/add-coupon',adminAuth,couponController.getAddCouponPage)
router.post('/admin/add-coupon',adminAuth, couponController.addCoupon)
router.delete('/admin/delete-coupon/:couponId', couponController.deleteCoupon);

//Brand Management

router.get('/admin/brands',adminAuth,brandController.getAllBrands)
router.get('/admin/addbrand',adminAuth,brandController.getAddBrand)
router.post('/admin/addbrand',adminAuth,logoUpload.single('logo'),brandController.addBrands)
router.get('/admin/editbrand/:id', adminAuth, brandController.getEditBrand);
router.post('/admin/editbrand/:id', adminAuth, upload.single('logo'), brandController.editBrand);

router.delete('/admin/brands/delete/:id',adminAuth, brandController.deleteBrand);



//charts
router.get('/top-products', adminAuth, chartController.topProducts);
router.get('/top-categories', adminAuth, chartController.topCategories);
router.get('/top-brands', adminAuth, chartController.topBrands);



// Error Page
router.get('/pageerror', adminController.pageerror);

module.exports = router;
