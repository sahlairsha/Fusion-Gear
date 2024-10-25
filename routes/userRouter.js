const express = require("express");

const router = express.Router();

const userController = require('../controller/userController')



router.get('/',userController.loadHomePage)





router.get('*',userController.pageNotFound)



module.exports = router;