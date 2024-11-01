const express = require('express');

const router = express.Router();

const adminController = require('../controller/admin/adminController')

router.get('/admin',adminController.loadLogin);
router.post('/admin',adminController.login)
router.get('/admin/dashboard',adminController.loadDashboard)

module.exports = router;