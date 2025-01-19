const env = require('dotenv').config();
const User = require('../../models/userSchema');
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get Wallet details
const getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.render('wallet', {
            user,
            walletBalance: user.wallet,
            transactions: user.transactions || [],
            activePage: 'wallet'
        });
    } catch (error) {
        console.error("Error loading wallet:", error);
        res.status(500).json({ message: 'Failed to load wallet.' });
    }
};

// Add Money to Wallet
const addMoney = async (amount, userId) => {
    try {
        if (!userId) throw new Error('User ID is required');

        const user = await User.findById(userId);

        if (!user) throw new Error('User not found.');

        // Add the money to wallet
        user.wallet += amount;

        // Create a transaction record
        user.transactions.push({ type: 'Credit', amount });

        // Save the user with updated wallet and transactions
        await user.save();

        return user;
    } catch (error) {
        console.error('Error adding money:', error);
        throw error;
    }
};

// Endpoint to Add Money through Razorpay
const addWallet = async (req, res) => {
    const { amount } = req.body;
    const userId = req.session.user;

    // Validate amount
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount.' });
    }

    try {
        // Add money and get updated user info
        const updatedUser = await addMoney(parseFloat(amount), userId);

        // Respond with new balance and transaction details
        const newBalance = updatedUser.wallet;
        const newTransaction = updatedUser.transactions[updatedUser.transactions.length - 1];

        res.json({
            newBalance: newBalance,
            transaction: newTransaction
        });
    } catch (error) {
        console.error('Error adding money:', error);
        res.status(500).json({ message: 'Failed to add money.' });
    }
};

// Create Razorpay Order
const createOrder = async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount." });
    }

    try {
        const options = {
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        console.log("Amount received in createOrder:", amount);
        console.log("Options received in createOrder:", options);

        const order = await razorpay.orders.create(options);
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Failed to create order." });
    }
};

// Verify Razorpay Payment
const verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.session.user;

    if (!userId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: "Invalid payment details." });
    }

    try {
        // Fetch the order details from Razorpay
        const order = await razorpay.orders.fetch(razorpayOrderId);

        if (!order || !order.amount) {
            return res.status(404).json({ message: "Order not found or invalid." });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Invalid payment signature." });
        }

        // Convert the amount from paise to rupees
        const amountInRupees = order.amount / 100;

        // Add the verified amount to the user's wallet
        const updatedUser = await addMoney(amountInRupees, userId);

        res.json({
            message: "Payment successful and wallet updated.",
            newBalance: updatedUser.wallet,
            transaction: updatedUser.transactions[updatedUser.transactions.length - 1],
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Failed to verify payment." });
    }
};


module.exports = {
    getWallet,
    addWallet,
    createOrder,
    verifyPayment
};
