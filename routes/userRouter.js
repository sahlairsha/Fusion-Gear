const express = require("express");

const router = express.Router();

const passport = require('../config/passport');


const userController = require('../controller/user/userController')
const userproductController = require('../controller/user/userproductController');
const userprofileController = require('../controller/user/userprofileController')
const userCartController = require('../controller/user/userCartController');
const userOrderController = require("../controller/user/userOrderController");


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

router.post('/forgot-password',userController.forgotPassword);

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
router.get("/product-ratings",userAuth,userproductController.productRatings)








//Coupon
router.get("/coupon",userproductController.getCoupon)


//user profile

router.get('/userProfile',userAuth,userprofileController.getProfile)   
router.put('/update-profile',userAuth,userprofileController.editProfile)
router.post('/update-password',userAuth,userprofileController.resetPassword)


//address view

router.get('/address-view',userAuth,userprofileController.viewAddress)
router.post('/address-view',userAuth,userprofileController.addAddress)
router.delete('/address-view/delete/:id',userAuth,userprofileController.deleteAddress)
router.get('/address-view/edit/:id',userAuth,userprofileController.editAddress)
router.post('/address-view/update/:id',userAuth,userprofileController.updateAddress);


//cart
router.get('/cart',userAuth,userCartController.getCartPage)
router.post('/cart/add/:productId',userAuth,userCartController.addToCart)
router.post('/cart/update-quantity/:productId', userAuth, userCartController.updateQuantity);
router.delete("/cart/delete/:productId",userAuth,userCartController.removeFromCart)

//Check out page for more information.....

router.get('/checkout',userAuth,userOrderController.getCheckout);
router.post('/save-address',userAuth,userOrderController.saveAddress)
router.get('/edit-address/:id',userAuth,userOrderController.getAddress)
router.post('/update-address/:id',userAuth,userOrderController.editAddress)
router.post('/set-selected-address',userAuth,userOrderController.selectAddress)
router.get("/payment",userAuth,userOrderController.getPayment)
router.get("/order-confirm",userAuth,userOrderController.getOrderConfirmation)
router.post('/confirm-order',userAuth,userOrderController.confirmOrder)
router.get('/order-details/:id',userAuth,userOrderController.orderDetails)
router.post('/orders/cancel/:id',userAuth,userOrderController.cancelOrder)

//ratings and reviews
router.get('/ratings',userAuth,userOrderController.getRating)
router.post('/ratings/submit',userAuth, userOrderController.submitRating);


router.post('/reviews',userAuth,userOrderController.submitReviews);
                     
router.get('/pagenotfound', userController.pageNotFound)





module.exports = router;