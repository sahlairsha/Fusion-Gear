const express = require("express");

const router = express.Router();

const passport = require('../config/passport');



const userController = require('../controller/user/userController')
const userproductController = require('../controller/user/userproductController')
const {userAuth} = require('../middleware/auth')


router.get('/',userAuth,userController.loadHomePage)

router.get('/signup',userController.loadSignup)

router.post('/signup',userController.signup)

router.post('/email-otp',userController.verifyOtp)

router.post('/resend-otp',userController.resendOtp)

router.get('/auth/google', passport.authenticate('google',{scope : ['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
        req.session.user = req.user._id;
        res.redirect('/');
    }
);
router.get('/login',userController.loadLogin)

router.post('/login',userController.login)

router.get('/logout', userController.logout)

//Product details and lists
router.get("/products",userAuth, userproductController.loadProducts)
router.get("/product/view",userAuth, userproductController.loadProductsDetails)



router.get('/pagenotfound', userController.pageNotFound)



module.exports = router;