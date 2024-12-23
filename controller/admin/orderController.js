

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


const getDetails = async(req,res)=>{
    try{

        const orderId = req.params.id;

        const orders = await Order.findById(orderId)
        .populate('products.product_id')
        .populate('shippingAddress.addressDocId')
        .exec()

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


const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Update order status
        order.order_status = status;

        // If the order is marked as delivered, record the delivery date
        if (status === 'Delivered') {
            order.delivery_date = new Date();
        }

        // Save the updated order
        await order.save();

        res.redirect(`/admin/order-details/${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const cancelOrderAdmin = async (req, res) => {
    const orderId = req.params.id;

    try {
        // Find the order by ID
        const order = await Order.findById(orderId).populate('products.product_id');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order is already canceled
        if (order.order_status === 'Canceled') {
            return res.status(400).send('Order is already canceled.');
        }

        // Update order status and add cancellation timestamp
        order.order_status = 'Canceled';
        order.canceled_at = new Date();

        // Restore product stock if needed
        for (const item of order.products) {
            const product = item.product_id;
            product.quantity += item.quantity;
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



module.exports = {
    getOrders,
    changeOrderStatus ,
    getDetails,
    updateOrderStatus,
    cancelOrderAdmin

}