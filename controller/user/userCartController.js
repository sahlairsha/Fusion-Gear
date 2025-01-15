const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");


async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter((item) => item.product_id);

    let cartTotal = 0;
    let totalDiscount = 0;

    for (const item of cartItems) {
        if (item.product_id) {
            const variantId = item.variant_id;
            const variant = item.product_id.variants.find(
                (v) => v._id.toString() === variantId.toString()
            );

            if (variant) {
                const salePrice = variant.salePrice;
                const offerPrice = item.product_id.offer?.discountPercentage
                    ? Math.round(salePrice * (1 - item.product_id.offer.discountPercentage / 100))
                    : salePrice;

                // Calculate totals
                cartTotal += offerPrice * item.quantity;

                // Calculate discount for this item
                const discountPerItem = salePrice - offerPrice;
                totalDiscount += discountPerItem * item.quantity;
            } else {
                console.log(
                    `Variant not found for product ${item.product_id._id} with variantId ${variantId}`
                );
            }
        } else {
            console.log("Item missing product_id:", item);
        }
    }

    const shippingCharges = cartTotal > 500 ? 0 : 50;
    const netAmount = cartTotal + shippingCharges;

    return {
        cartTotal: cartTotal.toFixed(2),
        discount: totalDiscount.toFixed(2), // Total discount amount
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
    };
}



const getCartPage = async (req, res) => {
    const userId = req.session.user;
    try {
        if (!userId) {
            req.flash("error", "Please login!!!");
            return res.redirect("/");
        }

        const user = await User.findById(userId).populate('cart.product_id').exec();

        const cartItems = user.cart.map((item) => {
            const product = item.product_id;
            if (!product) return null;

            const selectedVariant = product.variants.find(
                (variant) => variant._id.toString() === item.variant_id.toString()
            );

            return {
                product,
                selectedVariant,
                quantity: item.quantity,
            };
        }).filter(item => item !== null);


        console.log("Cart Items:", cartItems);

        const countItems = cartItems.length;
        req.session.cartCount = countItems;
        console.log("Cart Count",req.session.cartCount);

        const updatedCartTotals = await calculateCartTotals(userId);

        res.render("cart", {
            user,
            cartItems,
            ...updatedCartTotals, 
            couponMessage: "",
            cartCount: req.session.cartCount,
        });
    } catch (error) {
        console.error("Error loading cart page:", error.message);
        res.status(500).send("Error loading cart page");
    }
};


const addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity } = req.body;
        const userId = req.session.user;

        if (!quantity) {
            return res.status(400).json({ success: false, message: 'Quantity is required' });
        }

        const finalQuantity = quantity || 1;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.stock < finalQuantity) {
            return res.json({
                success: false,
                message: `Only ${variant.stock} left in stock.`,
            });
        }

        const user = await User.findById(userId);

        const existingItem = user.cart.find(item => item.product_id.toString() === productId && item.variant_id.toString() === variantId);

        if (existingItem) {
            const newQuantity = existingItem.quantity + finalQuantity;
            if (newQuantity > variant.stock) {
                return res.json({
                    success: false,
                    message: `Only ${variant.stock} left in stock.`,
                });
            }

            await User.updateOne(
                { _id: userId, "cart.product_id": productId, "cart.variant_id": variantId },
                { $set: { "cart.$.quantity": newQuantity } }
            );
        } else {
            user.cart.push({
                product_id: productId,
                variant_id: variantId,
                quantity: finalQuantity,
            });
            await user.save();
        }

        res.json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error("Error adding to cart:", error.message);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
};





const removeFromCart = async (req, res) => {
    const  userId  = req.session.user;
    const { productId } = req.params;
    try {

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { cart: { product_id: productId } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User or product not found in cart' });
        }

              const updatedCartTotals = await calculateCartTotals(userId);
              
              

                res.json({
                    success: true,
                    message: 'Product removed successfully',
                    ...updatedCartTotals,
                   
                });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
    }
};

const updateQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, variantId } = req.body; // Ensure variantId is passed
        const userId = req.session.user;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find the variant
        const selectedVariant = product.variants.find(
            (variant) => variant._id.toString() === variantId.toString()
        );

        if (!selectedVariant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        // Check stock availability
        if (quantity > selectedVariant.stock) {
            return res.json({
                success: false,
                message: `Only ${selectedVariant.stock} left in stock.`,
            });
        }

        // Update quantity in the cart
        const user = await User.findOneAndUpdate(
            { _id: userId, "cart.product_id": productId, "cart.variant_id": variantId },
            { $set: { "cart.$.quantity": quantity } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        // Recalculate cart totals
        const updatedCartTotals = await calculateCartTotals(userId);

        res.json({
            success: true,
            ...updatedCartTotals,
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Failed to update product quantity' });
    }
};




module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateQuantity,

};
