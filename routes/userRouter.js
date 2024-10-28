const express = require("express");

const router = express.Router();

const userController = require('../controller/userController')



router.get('/',userController.loadHomePage)

router.get('/signup',userController.loadSignup)

router.post('/signup',userController.signup)

router.get('/login',userController.loadLogin)

router.get('*',userController.pageNotFound)



module.exports = router;