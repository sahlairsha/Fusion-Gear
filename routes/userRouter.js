const express = require("express");

const router = express.Router();

const passport = require('../config/passport');


const userController = require('../controller/user/userController')
const userproductController = require('../controller/user/userproductController');
const userprofileController = require('../controller/user/userprofileController')
const userCartController = require('../controller/user/userCartController')
const userAuth = require('../middleware/auth')



router.get('/',userController.loadHomePage)

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

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/forgot-password', userController.forgotPassword);

router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        req.flash('error', 'Invalid request. No token provided.');
        return res.redirect('/forgot-password');
    }
    res.render('reset-password', { token });
});

router.post('/reset-password', userController.resetPassword);




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


//address view

router.get('/address-view',userAuth,userprofileController.viewAddress)
router.post('/address-view',userAuth,userprofileController.addAddress)
router.delete('/address-view/delete/:id',userAuth,userprofileController.deleteAddress)
router.get('/address-view/edit/:id',userAuth,userprofileController.editAddress)
router.post('/address-view/update/:id',userAuth,userprofileController.updateAddress);


//cart 
router.get('/cart',userAuth,userCartController.getCart)

router.get('/pagenotfound', userController.pageNotFound)





module.exports = router;