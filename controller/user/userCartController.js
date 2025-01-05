const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");


async function calculateCartTotals(userId) {
    const user = await User.findById(userId).populate('cart.product_id');
    const cartItems = user.cart.filter((item) => item.product_id);

    let cartTotal = 0;

    for (const item of cartItems) {
        if (item.product_id) {
            // Get the variantId stored in the cart
            const variantId = item.variant_id;

            // Find the selected variant for this product
            const variant = item.product_id.variants.find(
                (v) => v._id.toString() === variantId.toString()
            );

            if (variant) {
                const price = variant.salePrice || variant.regularPrice;
                cartTotal += price * item.quantity;
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
        discount: '0.00', 
        shippingCharges: shippingCharges.toFixed(2),
        netAmount: netAmount.toFixed(2),
    };
}





const getCartPage = async (req, res) => {
    const userId = req.session.user;
    try {
        // Ensure that the user is logged in
        if (!userId) {
            req.flash("error", "Please login!!!");
            return res.redirect("/");
        }

        // Fetch the user, populate both the product and variant references
        const user = await User.findById(userId)
        .populate('cart.product_id')
        .exec();

        // Filter out cart items without a product reference (in case of any data issues)
       
const cartItems = user.cart.map((item) => {
    const product = item.product_id; // Fetched via populate
    if (!product) return null; // Skip invalid product references

    // Find the variant by matching the variant_id
    const selectedVariant = product.variants.find(
        (variant) => variant._id.toString() === item.variant_id.toString()
    );

    return {
        product,
        selectedVariant,
        quantity: item.quantity,
    };
}).filter(item => item !== null);

        console.log("Cart Items: " + cartItems)
    

        // Calculate the total number of items in the cart
        const countItems = cartItems.length;
        req.session.cartCount = countItems;

        const selectedVariant = req.session.variant

        // Calculate the cart totals, ensuring variant prices are considered
        const updatedCartTotals = await calculateCartTotals(userId,selectedVariant);

        // Render the cart page, passing the cart items and other data to the view
        res.render("cart", {
            user,
            cartItems,
            ...updatedCartTotals,
            couponMessage: "", // Optional: Add logic for handling any coupon messages
            cartCount: req.session.cartCount, // Passing cart count to the session
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Error loading cart page");
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const { quantity } = req.body; // Parse quantity from the request body
        const userId = req.session.user;

        req.session.variant = variantId;
        const selectedVariant = req.session.variant;
        console.log("Selected variant:",selectedVariant)
        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find the selected variant
        const variant = product.variants.find(v => v._id.toString() ===  selectedVariant);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.stock < quantity) {
            return res.json({
                success: false,
                message: `Only ${variant.stock} left in stock. You can add up to ${variant.stock} to the cart.`,
            });
        }

        // Find the user
        const user = await User.findById(userId);

        // Check if the product is already in the cart
        const existingItem = user.cart.find(item => item.product_id.toString() === productId &&  item.variant_id.toString() === variantId);

        if (existingItem) {
            // Update the quantity
            const newQuantity = existingItem.quantity + quantity;
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
            // Add a new item to the cart
            user.cart.push({
                product_id: productId,
                variant_id: variantId,
                quantity: quantity,
            });
            await user.save();
        }

        res.json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error(error);
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
