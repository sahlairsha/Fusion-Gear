const express = require('express');

const router = express.Router();

const adminController = require('../controller/admin/adminController')

const {adminAuth} = require('../middleware/auth')

const customerController = require('../controller/admin/customerController')
const categoryController = require('../controller/admin/categoryController')
const productController = require('../controller/admin/productController')

const multer = require('multer');
const storage = require("../helper/multer")

const uploads = multer({storage : storage});



//Admin login & logout
router.get('/admin/login',adminController.loadLogin);
router.post('/admin/login',adminController.login)
router.get('/admin/logout',adminController.logout)
//Dashboard
router.get('/admin/dashboard',adminAuth,adminController.loadDashboard)

//Customer management
router.get('/admin/users',adminAuth,customerController.customerInfo)
router.get('/admin/blockedUser',adminAuth,customerController.blockedUser)
router.get('/admin/unblockedUser',adminAuth,customerController.unblockedUser)


//Category management
router.get('/admin/category',adminAuth,categoryController.categoryInfo)
router.get('/admin/addcategory',adminAuth,categoryController.inputCategories)
router.post('/admin/addcategory',adminAuth,categoryController.addCategories)
router.put('/admin/editcategory',adminAuth,categoryController.editCategories)
router.get('/admin/deletecategory',adminAuth,categoryController.deleteCategories)
router.get('/admin/restorecategory',adminAuth,categoryController.restoreCategories)



//Product management

router.get('/admin/add-products',adminAuth,productController.getProduct)
router.post('/admin/add-products',adminAuth,uploads.array("image",4),productController.addProducts);
router.get("/admin/products",adminAuth,productController.getAllProducts)
router.get("/admin/editproducts",adminAuth,productController.getEditProducts)
router.post("/admin/editproducts/:id",adminAuth,uploads.array('image',4),productController.editProducts)
router.post("/deleteImage",adminAuth,productController.deleteImage);
router.get("/admin/deleteproducts",adminAuth,productController.deleteProducts)
router.get("/admin/restoreproduct",adminAuth,productController.deleteProducts)

router.get('/admin/blockedproduct',adminAuth,productController.blockProducts)
router.get('/admin/unblockedproduct',adminAuth,productController.unblockProducts)

//Error Page
router.get('/pageerror',adminController.pageerror);






module.exports = router;