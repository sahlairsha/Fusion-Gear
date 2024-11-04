const Product = require('../../models/productSchema')
const Category = require("../../models/categorySchema")
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')

const fs = require('fs');
const path = require('path');
const sharp = require('sharp')


const getProduct = async(req,res)=>{
    try { 
        const category = await Category.find({isListed : true});
        const brand = await Brand.find({isBlocked : false})
        res.render("addProduct",{
            cat : category,
            brand : brand
        })
    } catch (error) {
        console.error("Error in loading the add product page")
        res.redirect("/pageerror")
    }
}


const addProducts = async(req,res)=>{
    try {
        const product = req.body;
        const productExists = await  Product.findOne({
            productName:product.productName
        })

        if(!productExists){
            const images = [];
            if(req.file && req.file.length > 0){
                for(let i=0;i <req.file.length;i++){
                    const originalImagePath = req.file[i].path;

                    const resizedImagePath = path.join(__dirname,"Public",'uploads','product-image',req.file[i].filename)
                    await sharp(originalImagePath).resize({width: 440,height:440}).toFile(resizedImagePath);
                    images.push(req.file[i].filename)
                }

                const  categoryId = await Category.findOne({name : product.category});
                if(!categoryId){
                    return res.status(400).json("Invalid category name")
                }

                const newProduct = new Product({
                    productName : product.productName,
                    description : product.description,
                    brand : product.brand,
                    categoryId:categoryId._id,
                    regularPrice : product.regularPrice,
                    salePrice : product.salePrice,
                    createdOn : new Date(),
                    quantity : product.quantity,
                    size: product.size,
                    color:product.color,
                    productImage : images,
                    status : 'Available'
                })

await newProduct.save()
return res.redirect("/admin/addProduct")


            }else{
                return res.status(400).json("Product already existed")
            }
        }
    } catch (error) {
        console.error("Error saving product",error);
        return res.redirect('/pageerror')
    }
}


module.exports = {
    getProduct,
    addProducts
}