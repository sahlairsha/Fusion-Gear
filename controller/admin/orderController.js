

const Order = require('../../models/orderSchema');


const getOrders = async(req,res)=>{
    try {

        let page = req.query.page || 1;
        let limit= 5
        
        const orders = await Order.find({})
         .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user_id', 'full_name') 
            .populate('products.product_id')
            .exec();
          const count = await Order.find().countDocuments()
    
        res.render('orders', {
            orders,
            totalPages : Math.ceil(count/limit),
            currentPage:page,
        })
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