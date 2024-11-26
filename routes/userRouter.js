const express = require("express");

const router = express.Router();

const passport = require('../config/passport');


const userController = require('../controller/user/userController')
const userproductController = require('../controller/user/userproductController');
const userprofileController = require('../controller/user/userprofileController')
const userAuth = require('../middleware/auth')


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
router.get("/products",userAuth,userproductController.loadProducts)
router.get("/product/view",userAuth,userproductController.loadProductsDetails)



// Product Rating

router.post('/rate', userproductController.rateProduct);
router.get('/ratings/:product_id', userproductController.getProductRatings);


//Coupon
router.get("/coupon",userproductController.getCoupon)
router.post('/apply-coupon',userproductController.applyCoupon)


//user profile

router.get('/userProfile',userAuth,userprofileController.getProfile)
router.put('/update-profile',userAuth,userprofileController.editProfile)

router.get('/pagenotfound', userController.pageNotFound)





module.exports = router;