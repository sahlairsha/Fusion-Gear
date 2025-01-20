const express = require("express");

const router = express.Router();

const passport = require('../config/passport');

const crypto = require('crypto');
const User = require('../models/userSchema')

const userController = require('../controller/user/userController')
const userproductController = require('../controller/user/userproductController');
const userprofileController = require('../controller/user/userprofileController')
const userCartController = require('../controller/user/userCartController');
const userOrderController = require("../controller/user/userOrderController");
const wishlistController = require("../controller/user/wishlistController");
const walletController = require('../controller/user/walletController')


const userAuth = require('../middleware/auth')



router.get('/',userController.loadHomePage)

router.get('/signup',userController.loadSignup)

router.post('/signup',userController.signup)

router.post('/email-otp',userController.verifyOtp)

router.post('/resend-otp',userController.resendOtp)

router.get('/auth/google', passport.authenticate('google',{scope : ['profile','email']}))


router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }),
    async (req, res) => {
        try {
            // Attach the user to the session
            const user = req.user;
            req.session.user = user._id;

            // Handle referral code if present
            const referralCode = req.query.referral_code;
            if (referralCode) {
                const referrer = await User.findOne({ referralCode });

                if (referrer) {
                    // Reward the referrer
                    referrer.wallet += 10;
                    referrer.redeemedUser.push(user._id); // Link the referred user to the referrer

                    // Log the referral bonus transaction for the referrer
                    referrer.transactions.push({
                        type: 'referral_bonus',
                        amount: 10,
                        date: new Date(),
                    });
                    await referrer.save();

                    // Reward the referred user
                    user.wallet = (user.wallet || 0) + 5; // Ensure wallet is initialized
                    user.redeemedBy = referrer._id; // Link the referrer to the referred user

                    // Log the referral bonus transaction for the new user
                    user.transactions.push({
                        type: 'referral_bonus',
                        amount: 5,
                        date: new Date(),
                    });
                }
            }

            // Generate a unique referral code for the new user if they don't already have one
            if (!user.referralCode) {
                const generateReferralCode = () =>
                    crypto.randomBytes(4).toString('hex').toUpperCase();

                let newReferralCode;
                let isUnique = false;

                while (!isUnique) {
                    newReferralCode = generateReferralCode();
                    const existingCode = await User.findOne({ referralCode: newReferralCode });
                    if (!existingCode) {
                        isUnique = true;
                    }
                }

                user.referralCode = newReferralCode;
            }

            // Save updated user details
            await user.save();

            // Redirect to the referral page or dashboard
            res.redirect('/referral');
        } catch (error) {
            console.error('Error handling referral during Google sign-in:', error);
            res.redirect('/signup');
        }
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


router.get('/wallet', userAuth,walletController.getWallet);
router.post('/wallet/add',userAuth,walletController.addWallet);
router.post('/wallet/create-order',userAuth,walletController.createOrder)
router.post('/wallet/verify-payment',userAuth,walletController.verifyPayment)

//Product details and lists
router.get("/products",userAuth,userproductController.loadProducts)
router.get("/product/view",userAuth,userproductController.loadProductsDetails)
router.get("/product-ratings",userAuth,userproductController.productRatings)










//user profile

router.get('/userProfile',userAuth,userprofileController.getProfile)   
router.put('/update-profile',userAuth,userprofileController.editProfile)
router.post('/update-password',userAuth,userprofileController.resetPassword)
router.get('/referral',userAuth,userprofileController.refferalPage)


//address view

router.get('/address-view',userAuth,userprofileController.viewAddress)
router.post('/address-view',userAuth,userprofileController.addAddress)
router.delete('/address-view/delete/:id',userAuth,userprofileController.deleteAddress)
router.get('/address-view/edit/:id',userAuth,userprofileController.editAddress)
router.post('/address-view/update/:id',userAuth,userprofileController.updateAddress);


//cart
router.get('/cart',userAuth,userCartController.getCartPage)
router.post('/cart/add', userAuth, userCartController.addToCart);
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
router.get('/orders/cancel/confirm',userAuth,userOrderController.getCancelConfirmation)
router.post('/orders/cancel/:id',userAuth,userOrderController.cancelOrder)
router.get('/checkout/apply-coupon', userAuth,userOrderController.applyCoupon);
router.post('/remove-coupon', userAuth,userOrderController.removeCoupon);

router.get('/generate-invoice/:orderId',userAuth,userOrderController.generateInvoice);
router.post('/retry-payment',userAuth,userOrderController.retryPayment);
router.post('/retry-payment-verify',userAuth,userOrderController.RetryPaymentVerification)


//Razorpay integration
router.post('/create-razorpay-order',userAuth,userOrderController.createRazorpay)
router.post('/verify-payment',userAuth,userOrderController.verifyPayment)

//ratings and reviews
router.get('/ratings',userAuth,userOrderController.getRating)
router.post('/ratings/submit',userAuth, userOrderController.submitRating);

router.get('/order/return-form/:orderId',userAuth,userOrderController.getReturnPage)
router.post('/order/return',userAuth,userOrderController.returnReason )

//whishlist 

router.get('/wishlist',userAuth, wishlistController.getWishlist)
router.post('/wishlist/add',userAuth, wishlistController.addToWhishlist)
router.delete('/wishlist/remove',userAuth, wishlistController.removeFromWishlist)
router.post('/reviews',userAuth,userOrderController.submitReviews);
                     
router.get('/pagenotfound', userController.pageNotFound)





module.exports = router;