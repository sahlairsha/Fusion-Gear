const Product = require('../../models/productSchema')
const Category = require("../../models/categorySchema")
const User = require('../../models/userSchema')
const ProductVariant = require('../../models/productVariantSchema')

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

        // Check if the product already exists
        const productExists = await Product.findOne({ productName: product.productName });
        if (productExists) {
            req.flash("error", "Product already exists");
            return res.status(400).redirect('/admin/add-products');
        }

        // Process images
        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const originalImagePath = file.path;
                    const resizedImagePath = path.join(__dirname, '../../Public/uploads/public-image', file.filename);
                    await sharp(originalImagePath).toFile(resizedImagePath);
                    images.push(file.filename);
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

        // Validate the category
        const categoryId = product.category;
        if (!categoryId) {
            req.flash("error", "Category is required");
            return res.status(400).redirect('/admin/add-products');
        }

        // Create the product
        const newProduct = new Product({
            productName: product.productName,
            description: product.description,
            category: categoryId,
            productImage: images,
            isBlocked: false,
            isDeleted: false,
            ratings: { average: 0, count: 0 },
        });

        const savedProduct = await newProduct.save();

        // Parse and validate variants
        let variants = [];
        if (product.variants) {
            try {
                variants = JSON.parse(product.variants); 
            } catch (error) {
                req.flash("error", "Invalid variants data");
                return res.status(400).redirect('/admin/add-products');
            }

            if (!Array.isArray(variants) || variants.length === 0) {
                req.flash("error", "At least one product variant is required");
                return res.status(400).redirect('/admin/add-products');
            }
        } else {
            req.flash("error", "Product variants are required");
            return res.status(400).redirect('/admin/add-products');
        }

        // Create ProductVariant document
        const productVariant = new ProductVariant({
            product_id: savedProduct._id,
            variant: variants.map((variant) => ({
                color: variant.color,
                size: variant.size,
                stock: variant.stock,
                regularPrice: variant.regularPrice,
                salePrice: variant.salePrice || 0,
                status: "Available",
            })),
        });

        await productVariant.save();

        req.flash("success", "Product and variants added successfully");
        res.status(201).redirect("/admin/add-products");
    } catch (error) {
        console.error("Error adding product:", error);
        req.flash("error", "Something went wrong. Please try again.");
        res.status(500).redirect('/admin/add-products');
    }
};



const getAllProducts = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page, 10) || 1;

        const limit = 4;

        // Fetch products
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*"), $options: "i" } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('category')
            .exec();

        // Fetch total product count
        const count = await Product.countDocuments({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*"), $options: "i" } },
            ],
        });

        // Fetch categories
        const category = await Category.find({ isListed: true });

        // Attach variants to each product
        const productsWithVariants = await Promise.all(
            productData.map(async (product) => {
                const productVariants = await ProductVariant.findOne({ product_id: product._id });
                return {
                    ...product.toObject(),
                    variants: productVariants ? productVariants.variant : [],
                };
            })
        );

        if (category) {
            res.render("products", {
                data: productsWithVariants,
                category: category,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
            });
        } else {
            req.flash("error", "Category not found. Please try again.");
            res.redirect("/admin/products");
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        res.redirect("/pageerror");
    }
};





const getEditProducts = async (req, res) => {
    try {

        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({})

        res.render("edit-product",{
            product : product,
            category: category
        })

    } catch (error) {
        console.error("There is an error in product editing", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




const editProducts = async(req,res) =>{

    try {
        const id = req.params.id;
        const product = await Product.findOne({_id: id });
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
            category : data.category,
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





const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate("category")
            .exec()

         // Fetch the variants for the product
         const productVariant = await ProductVariant.findOne({ product_id: productId });

         // Extract the variants array
         const variants = productVariant ? productVariant.variant : [];

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/products");
        }

        res.render("admin-product-details", { product,variants });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};

const getEditVariant = async (req, res) => {
    try {
        const variantId = req.params.id;

        // Find the document containing the specific variant ID
        const productVariant = await ProductVariant.findOne({ "variant._id": variantId });

        if (!productVariant) {
            return res.status(404).send('Variant not found');
        }

        // Find the specific variant inside the array
        const targetVariant = productVariant.variant.find(v => v._id.toString() === variantId);
        if (!targetVariant) {
            return res.status(404).send('Variant not found');
        }

        const product = await Product.findById(productVariant.product_id);

        res.render('edit-variant', {
            variant: targetVariant,
            product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const editVariant = async (req, res) => {
    try {
        const variantId = req.params.id;
        const { color, size, stock, regularPrice, salePrice, status } = req.body;

        // Find the document containing the variant
        const productVariant = await ProductVariant.findOne({ "variant._id": variantId });

        if (!productVariant) {
            return res.status(404).send('Variant not found');
        }

        // Find the specific variant within the array
        const targetVariant = productVariant.variant.find(v => v._id.toString() === variantId);
        if (targetVariant) {
            // Update the fields of the variant
            targetVariant.color = color;
            targetVariant.size = size;
            targetVariant.stock = stock;
            targetVariant.regularPrice = regularPrice;
            targetVariant.salePrice = salePrice;
            targetVariant.status = status;

            // Save the updated document
            await productVariant.save();
        } else {
            return res.status(404).send('Variant not found');
        }

        res.redirect(`/admin/product-details/${productVariant.product_id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const addVariant = async (req, res) => {
    try {
        const { color, size, regularPrice, salePrice, stock } = req.body;
        const productId = req.params.id;

        const variant = {
            color,
            size,
            regularPrice,
            salePrice,
            stock
        };

        await ProductVariant.updateOne(
            { product_id: productId },
            { $push: { variant } },
            { upsert: true }
        );

        res.redirect(`/admin/product-details/${productId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const deleteVariant = async (req, res) => {
    try {
        const variantId = req.params.id;

        // Pull the variant from the 'variant' array
        const variantDoc = await ProductVariant.findOneAndUpdate(
            { "variant._id": variantId },
            { $pull: { variant: { _id: variantId } } },
            { new: true } 
        );

        if (!variantDoc) {
            return res.status(404).send('Variant not found');
        }

        
        res.redirect(`/admin/product-details/${variantDoc.product_id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};





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
    unblockProducts,
    getProductDetails,
    getEditVariant,
    editVariant,
    addVariant,
    deleteVariant
}