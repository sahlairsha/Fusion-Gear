
const { getIo, emitToUser  } = require('../../config/socket')
const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');


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

        const validStatuses = ['Pending','Dispatch','Shipped', 'Delivered', 'Canceled','Return'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Prevent rollback if the current status is Delivered or Canceled
        if (['Delivered', 'Canceled',"Return"].includes(order.order_status) && order.order_status !== status) {
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
        .sort({createdAt: -1})
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



const processRefundAndRestock = async (order) => {
    // Refund logic
    if (["Wallet", "Razorpay"].includes(order.payment_method)) {
        const user = await User.findById(order.user_id);
        if (user) {
            user.wallet += order.total_price;
            user.transactions.push({
                type: "Credit",
                amount: order.total_price,
                description: `Refund for canceled order ${order._id}`,
                date: new Date(),
            });
            await user.save();
        }
    }

    // Restock logic
    for (const item of order.products) {
        const product = await Product.findById(item.product_id);
        if (product) {
            const variant = product.variants.find(v => v._id.toString() === item.variant_id.toString());
            if (variant) {
                variant.stock += item.quantity;
                await product.save();
            }
        }
    }
};

const adminCancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const { action } = req.body; 

    try {
        const order = await Order.findById(orderId);
        if (!order || order.order_status !== 'Pending Cancellation') {
            return res.status(400).send('Invalid or non-pending order');
        }

        if (action === 'approve') {
            order.order_status = 'Canceled';
            order.canceled_at = new Date();
            order.payment_status = 'Refunded';

            await processRefundAndRestock(order);

            // Emit to the user via Socket.IO
            emitToUser(order.user_id, 'order_update', {
                status: 'approved',
                orderId: order._id,
                message: `Your cancellation request for Order ${order._id} has been approved.`,
            });

            await order.save();
            res.json({ message: 'Order cancellation approved' });
        } else if (action === 'reject') {
            order.order_status = 'Dispatch';

            // Emit to the user via Socket.IO
            emitToUser(order.user_id, 'order_update', {
                status: 'rejected',
                orderId: order._id,
                message: `Your cancellation request for Order ${order._id} has been rejected.`,
            });

            await order.save();
            res.json({ message: 'Order cancellation rejected' });
        } else {
            res.status(400).send('Invalid action');
        }
    } catch (error) {
        console.error('Error in adminCancelOrder:', error);
        res.status(500).send('Server Error');
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
    adminCancelOrder,
    approveReturn,
    rejectReturn

}