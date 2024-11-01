const express = require('express');

const router = express.Router();

const adminController = require('../controller/admin/adminController')

const {adminAuth} = require('../middleware/auth')

router.get('/admin',adminController.loadLogin);
router.post('/admin',adminController.login)
router.get('/admin/dashboard',adminAuth,adminController.loadDashboard)
router.get('/pageerror',adminController.pageerror)










module.exports = router;