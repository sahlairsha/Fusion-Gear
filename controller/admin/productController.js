const Product = require('../../models/productSchema')
const Category = require("../../models/categorySchema")
const User = require('../../models/userSchema')

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');



const getProduct = async(req,res)=>{
    try {
        const category = await Category.find({isListed : true});
        res.render("addProduct",{
            cat : category,
        })
    } catch (error) {
        console.error("Error in loading the add product page")
        res.redirect("/pageerror")
    }
}


const addProducts = async (req, res) => {
    try {
        const product = req.body;

        // Check if product already exists
        const productExists = await Product.findOne({ productName: product.productName });
        if (productExists) {
            req.flash("error", "Product already exists");
            return res.status(400).redirect('/admin/add-products');
        }

        // Process images
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                try {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join(__dirname, '../../Public/uploads/public-image', req.files[i].filename);
                    await sharp(originalImagePath).toFile(resizedImagePath);
                    images.push(req.files[i].filename)
                } catch (error) {
                    console.error("Image processing error:", error);
                    req.flash("error", "Error processing images");
                    return res.status(500).redirect('/admin/add-products');
                }
            }
        } else {
            req.flash("error", "No images uploaded");
            return res.status(400).redirect('/admin/add-products');
        }

        // Find the category by ID
        const categoryId = product.category;  // Now we expect categoryId as the form value
        if (!categoryId) {
            req.flash("error", "Category is required");
            return res.status(400).redirect('/admin/add-products');
        }

        // Create the new product
        const newProduct = new Product({
            productName: product.productName,
            description: product.description,
            category: categoryId,
            regularPrice: product.regularPrice,
            salePrice: product.salePrice,
            createdOn: new Date(),
            quantity: product.quantity,
            size: product.size,
            color: product.color,
            productImage: images,
            status: 'Available'
        });

        await newProduct.save();
        res.status(201).redirect("/admin/add-products");

    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).redirect('/pageerror');
    }
};

const getAllProducts = async(req,res)=>{
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page , 10) || 1

        const limit = 4;
        const productData = await Product.find(
            {
                $or : [
                    { productName : { $regex : new RegExp(".*" + search + ".*")}}
                ],
            })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('category')
            .exec();
            const count = await Product.find({
                $or : [
                    { productName: { $regex: new RegExp(".*" + search + ".*") } }
                ]
            }).countDocuments();

            const category = await Category.find({isListed : true});

            if(category){
                res.render("products",{
                    data : productData,
                    category : category,
                    totalPages : Math.ceil(count/limit),
                    currentPage: page
                })
            }else{
                req.flash("error","Category not found,Please try again");
                req.redirect("/admin/products")
            }

    } catch (error) {
        res.redirect("/pageerror")
    }
}





const getEditProducts = async (req, res) => {
    try {

        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({})

        res.render("edit-product",{
            product : product,
            category:category
        })

    } catch (error) {
        console.error("There is an error in product editing", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




const editProducts = async(req,res) =>{

    try {
        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName : data.productName,
            _id : {$ne : id}
        })
        if(existingProduct){
             req.flash("error","Product with this name already existed, Please try again");
             res.redirect("/admin/editproducts")
        }


        const images = [];

        if(req.files && req.files.length > 0){
            for(let i=0;i<req.files.length ; i++){
                images.push(req.files[i].filename)
            }
        }


        const updateFields = {
            productName : data.productName,
            description : data.description,
            category : product.category,
            regularPrice : data.regularPrice,
            salePrice : data.salePrice,
            color : data.color,
            quantity : data.quantity,
            size : data.size,

        }

if(req.files.length > 0){
    updateFields.$push = {productImage : {$each : images}}
}


await Product.findByIdAndUpdate(id,updateFields,{new : true});

res.redirect("/admin/products")


    } catch (error) {
        console.error(error);
        res.redirect("/pageerror")
    }

}


const deleteImage = async(req,res)=>{
    try {
        const {imageNameToServer ,productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull : {productImage : imageNameToServer}})
        const imagePath = path.join("Public","uploads","public-image",imageNameToServer)

        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully` )
        }else{
            console.log(`Image ${imageNameToServer} not found ` )
        }


        res.send({status : true})
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const deleteProducts = async (req, res) => {
    try {
        let {id} = req.query;
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } },
            { new: true }
        );
        res.redirect('/admin/products');
    } catch (error) {
        console.error("There is an error in deleting", error);
        res.status(500).redirect('/pageerror')
    }
}


const restoreProduct = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).redirect('/pageerror');
        }

        const restoredProduct = await Product.findOneAndUpdate(
            { _id: id, isDeleted: true },
            {
                isDeleted: false,
                deletedAt: null
            },
            { new: true }
        );

        if (!restoredProduct) {
            return res.status(404).redirect('/pageerror');
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.error("There is an error in restoring product:", error);
        res.status(500).redirect('/pageerror');
    }
}



const blockProducts = async(req,res)=>{
    try{

        const id = req.query.id;
        await Product.updateOne({_id:id},{$set : {isBlocked : true}});
        res.redirect("/admin/products")
    }catch(error){
        console.log("Error in blocking product",error);
        res.redirect("/pageerror")
    }
}


const unblockProducts = async(req,res)=>{
    try{
        const id = req.query.id;
        await Product.updateOne({_id:id},{$set : {isBlocked : false}});
        res.redirect("/admin/products")
    }catch(error){
        console.log("Error in unblocking product",error);
        res.redirect("/pageerror")
    }
}


module.exports = {
    getProduct,
    addProducts,
    getAllProducts,
    getEditProducts,
    editProducts,
    deleteProducts,
    deleteImage,
    restoreProduct,
    blockProducts,
    unblockProducts
}