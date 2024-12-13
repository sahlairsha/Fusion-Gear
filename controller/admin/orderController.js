

const Order = require('../../models/orderSchema');


const getOrders = async(req,res)=>{
    try {
        const orders = await Order.find()
        .populate('user_id', 'name email')
        .populate('products.product_id', 'productName description salePrice category productImage')  
        .populate('shippingAddress.address_id', 'street city postalCode');  
    
        res.render('orders', {orders})
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}
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