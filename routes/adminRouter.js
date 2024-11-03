const express = require('express');

const router = express.Router();

const adminController = require('../controller/admin/adminController')

const {adminAuth} = require('../middleware/auth')

const customerController = require('../controller/admin/customerController')

router.get('/admin/login',adminController.loadLogin);
router.post('/admin/login',adminController.login)
router.get('/admin/dashboard',adminAuth,adminController.loadDashboard)
router.get('/admin/logout',adminController.logout)
router.get('/admin/users',adminAuth,customerController.customerInfo)
router.get('/admin/blockedUser',adminAuth,customerController.blockedUser)
router.get('/admin/unblockedUser',adminAuth,customerController.unblockedUser)
router.get('/pageerror',adminController.pageerror)

module.exports = router;