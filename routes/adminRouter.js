const express = require('express');

const router = express.Router();

const adminController = require('../controller/admin/adminController')

const {adminAuth} = require('../middleware/auth')

const customerController = require('../controller/admin/customerController')
const categoryController = require('../controller/admin/categoryController')
const brandController = require('../controller/admin/brandController')

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
router.post('/admin/addOffer',adminAuth,categoryController.addOffer)
router.post('/admin/removeOffer',adminAuth,categoryController.removeOffer)
router.put('/admin/editcategory',adminAuth,categoryController.editCategories)
router.delete('/admin/deletecategory',adminAuth,categoryController.deleteCategories)
router.get('/admin/listedCategory',adminAuth,categoryController.listedCategories)
router.get('/admin/unlistedCategory',adminAuth,categoryController.unlistedCategories)


//Brand management

router.get('/admin/brands',adminAuth,brandController.getBrandPage)
router.post('/admin/brands/add',adminAuth,uploads.single("image"),brandController.addBrand);
router.get('/admin/blockedBrand',adminAuth,brandController.blockedBrand)
router.get('/admin/unblockedBrand',adminAuth,brandController.unblockedBrand)
router.delete('/admin/deleteBrand',adminAuth,brandController.deleteBrand)

//Error Page
router.get('/pageerror',adminController.pageerror)





module.exports = router;