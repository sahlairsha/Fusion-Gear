
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
            .sort({createdAt : -1})
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
        const adminData = await User.findById(req.session.admin)
        res.render('orders', {
            orders: ordersWithAddresses,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            admin:adminData
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
        .populate({
            path: 'products.product_id',
            select: 'productName productImage salePrice regularPrice',
        })
        .populate('shippingAddress.addressDocId')
        .exec()

        for (let item of orders.products) {
            const variant = await Product.findOne({
                _id: item.product_id._id,
                "variants._id": item.variant_id,
            });

            if (variant) {
                const variantDetails = variant.variants.find(v => v._id.toString() === item.variant_id.toString());
                item.variantDetails = variantDetails || {}; 
            } else {
                item.variantDetails = {}; 
            }
        }

    const specificAddress = orders.shippingAddress.addressDocId.address[orders.shippingAddress.addressIndex];
    console.log("Order with specific address:", specificAddress);

const adminData = await User.findById(req.session.admin)

        res.render("admin-order-details",{
            orders,
            shippingAddress : specificAddress,
            admin: adminData
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
                type: "Refund",
                amount: order.total_price,
                description: `Refund for order ${order._id}`,
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
                message: `Your cancellation request for Order ${order._id} has been approved.Refunded to the Wallet`,
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


// Approve or reject the return request (admin side)
const handleReturnRequest = async (req, res) => {

    const {orderId} = req.params
    const { action } = req.body;

    try {
        // Find the order in the database
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (action === 'approve') {
            // Change the order status to 'Returned'
            order.order_status = 'Return';
            

            await processRefundAndRestock(order);
            emitToUser(order.user_id, 'order_update', {
                status: 'approved',
                orderId: order._id,
                message: `Your return request for Order ${order._id} has been approved.Refunded to the Wallet`,
            });

        } else if (action === 'reject') {
            // Change the order status to 'Delivered'
            order.order_status = 'Delivered';
            

            emitToUser(order.user_id, 'order_update', {
                status: 'rejected',
                orderId: order._id,
                message: `Your Return request for Order ${order._id} has been rejected.`,
            });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await order.save();
        res.json({ success: true, message: `Return request ${action}d successfully.` });
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Failed to process return request.' });
    }
};


module.exports = {
    getOrders,
    changeOrderStatus ,
    getDetails,
    adminCancelOrder,
    handleReturnRequest

}