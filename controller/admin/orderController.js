

const Order = require('../../models/orderSchema');



const getOrders = async (req, res) => {
    try {
        let page = req.query.page || 1;
        let limit = 5;

        const orders = await Order.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user_id')
            .populate('products.product_id')
            .populate('shippingAddress.addressDocId')
            .exec();

        const count = await Order.find().countDocuments();

        // Accessing specific shipping address for each order
        const ordersWithAddresses = orders.map(order => {
            if (order.shippingAddress && order.shippingAddress.addressDocId) {
                // Safely access specific address if exists
                const specificAddress = order.shippingAddress.addressDocId.address[order.shippingAddress.addressIndex];
                return {
                    ...order.toObject(),
                    specificAddress: specificAddress || null
                };
            } else {
                return {
                    ...order.toObject(),
                    specificAddress: null
                };
            }
        });

        res.render('orders', {
            orders: ordersWithAddresses,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const changeOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Canceled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Prevent rollback if the current status is Delivered or Canceled
        if (['Delivered', 'Canceled'].includes(order.order_status) && order.order_status !== status) {
            return res.status(400).json({ 
                message: `Cannot change status from ${order.order_status}` 
            });
        }

        order.order_status = status;
        await order.save();

        return res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server Error' });
    }
};



const getDetails = async(req,res)=>{
    try{

        const orderId = req.params.id;

        const orders = await Order.findById(orderId)
        .populate('products.product_id')
        .populate('shippingAddress.addressDocId')
        .exec()


        for (let item of orders.products) {
            const productVariant = await ProductVariant.findOne({ product_id: item.product_id._id });
            item.variantDetails = productVariant ? productVariant.variant : [];
        }

    const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];
    console.log("Order with specific address:", specificAddress);


        res.render("admin-order-details",{
            orders,
            shippingAddress : specificAddress
        })

    }catch(error){

        console.error(error);
        res.status(500).send('Server Error');

    }
}

const cancelOrderAdmin = async (req, res) => {
    const orderId = req.params.id;

    try {
        // Find the order by ID
        const order = await Order.findById(orderId).populate('products.product_id');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.order_status === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel an order that has already been delivered.' });
        }

        // Check if the order is already canceled
        if (order.order_status === 'Canceled') {
            return res.status(400).json({ message: 'Order is already canceled.' });
        }

        if (order.order_status === 'Return') {
            return res.status(400).json({ message: 'Cannot cancel an order that has already been Returned.' });
        }


        // Update order status and add cancellation timestamp
        order.order_status = 'Canceled';
        order.canceled_at = new Date();

        // Restore product stock in variants
        for (const item of order.products) {
            const product = item.product_id; // Get the product document
            const { variantId, quantity } = item; // Assuming the order stores variantId and quantity

            // Find the variant within the product's variants
            const variant = product.variants.find(v => v._id.toString() === variantId);


            if (variant) {
                variant.stock += quantity; // Increment the stock for the variant
            }

            // Save the updated product document
            await product.save();
        }

        // Save the updated order
        await order.save();

        // Redirect or respond to the admin
        res.redirect(`/admin/order-details/${orderId}`);
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).send('Internal Server Error');
    }
};

const approveReturn = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order || order.return_status !== 'Pending') {
            return res.status(400).json({ message: 'Return not pending or order not found.' });
        }

        // Mark return as approved and process refund
        order.return_status = 'Approved';
        order.refund_status = 'Completed';
        order.restocked_at = new Date();

   
        await order.save();

        res.json({ success: true, message: 'Return approved, refund processed.' });
    } catch (error) {
        console.error('Error approving return:', error);
        res.status(500).json({ success: false, message: 'Failed to approve return' });
    }
};

const rejectReturn = async(req,res)=>{
    const { orderId } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order || order.return_status !== 'Pending') {
            return res.status(400).json({ message: 'Return not pending or order not found.' });
        }

        // Mark return as rejected
        order.return_status = 'Rejected';
        await order.save();
        res.json({ success: true, message: 'Return rejected.' });
    } catch (error) {
        console.error('Error rejecting return:', error);
        res.status(500).json({ success: false, message: 'Failed to reject return' });
    }
}

module.exports = {
    getOrders,
    changeOrderStatus ,
    getDetails,
    cancelOrderAdmin,
    approveReturn,
    rejectReturn

}