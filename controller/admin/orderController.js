

const Order = require('../../models/orderSchema');

const getOrders = async (req, res) => {
    try {
        let page = req.query.page || 1;
        let limit = 5;

        const orders = await Order.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user_id', 'full_name')
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
            return res.status(400).send('Invalid status');
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        order.order_status = status;
        await order.save();

        res.status(200).send('Order status updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    getOrders,
    changeOrderStatus 
}