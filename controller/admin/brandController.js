const Brand = require('../../models/brandSchema');
const Products = require('../../models/productSchema');

const getBrandPage = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1) * limit

        const totalBrand = await Brand.countDocuments();

        const brandData = await Brand.find({})
        .sort({createdAt : -1})
        .skip(skip)
        .limit(limit)

        const totalPages = Math.ceil(totalBrand / limit);
        const reverseBrand = brandData.reverse();

        res.render("brand",{
             data: reverseBrand,
            currentPage : page,
            totalPages : totalPages,
            totalBrand : totalBrand
        })

    } catch (error) {
        console.error("Error in loading brand page",error)
        res.redirect('/pageerror')
    }
}


const addBrand = async(req,res)=>{
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({brand});
        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName : brand,
                brandImage : image
            })

            await brand.save();
            res.redirect("/admin/brands")
        }
    } catch (error) {
        console.error("Error in adding brand",error)
        res.redirect('/pageerror')
    }
}


module.exports = {
    getBrandPage,
    addBrand
}

