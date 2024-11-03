const User = require('../../models/userSchema')

const customerInfo = async(req,res)=>{
    try {
        let search = ""
        if(req.query.search){
            search = req.query.search;
        }
        let page = 1
        if(req.query.page){
            page = parseInt(req.query.page)
        }

        const limit = 3;
        const userData = await User.find(
            {
                isAdmin : false,
                $or : [
                    {name : { $regex :".*" + search + ".*" }},
                    {email : { $regex :".*" + search + ".*" }}
                ],
            }).limit(limit*1)
            .skip((page - 1) * limit )
            .exec();
            const count = await User.find({
                isAdmin : false,
                $or : [
                    {name : { $regex :".*" + search + ".*" }},
                    {email : { $regex :".*" + search + ".*" }}
                ]
            }).countDocuments();
        res.render("customers",{
            data : userData,
            totalPages : Math.ceil(count/limit),
            currentPage : page
        })
        } catch (error) {
            console.log("There is error in customer info",error)
        res.status(500).send("Internal Error")
    }
}

module.exports = {
    customerInfo
}