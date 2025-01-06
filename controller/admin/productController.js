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

        if (product.productOffer) {
            productOffer = parseFloat(product.productOffer);
            if (isNaN(productOffer) || productOffer < 0 || productOffer > 100) {
                req.flash("error", "Invalid product offer percentage");
                return res.status(400).redirect('/admin/add-products');
            }
        }

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

        // Create the product with variants directly in the document
        const newProduct = new Product({
            productName: product.productName,
            description: product.description,
            productOffer : productOffer,
            category: categoryId,
            productImage: images,
            isBlocked: false,
            isDeleted: false,
            ratings: { average: 0, count: 0 },
            variants: variants, // Directly add variants to the product document
        });

        const savedProduct = await newProduct.save();

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

        // Fetch products with variants and categories
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*"), $options: "i" } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('category')
            .populate('variants') 
            .exec();

      
        const count = await Product.countDocuments({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*"), $options: "i" } },
            ],
        });

        // Fetch categories
        const category = await Category.find({ isListed: true });

      
        if (category) {
            res.render("products", {
                data: productData,  
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
        const product = await Product.findOne({_id: id})
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



const editProducts = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // Check if product name already exists
        const existingProduct = await Product.findOne({ productName: data.productName, _id: { $ne: id } });

        if (existingProduct) {
            req.flash("error", "Product with this name already exists. Please try again.");
            return res.redirect(`/admin/editproducts?id=${id}`);
        }

        const variants = Array.isArray(data.variants) ? data.variants : JSON.parse(data.variants);
        const updatedVariants = [];

        for (let variant of variants) {
            // Check if the variant exists by matching color and size
            const existingVariant = await Product.findOne(
                { _id: id, "variants.color": variant.color, "variants.size": variant.size }
            );

            if (existingVariant) {
                // If the variant exists, update the specific variant
                await Product.updateOne(
                    { _id: id, "variants.color": variant.color, "variants.size": variant.size },
                    {
                        $set: {
                            "variants.$.stock": variant.stock,
                            "variants.$.regularPrice": variant.regularPrice,
                            "variants.$.salePrice": variant.salePrice || null,
                            "variants.$.status": variant.stock === 0 ? "Out of Stock" : "Available",
                        },
                    }
                );
            } else {
                // If the variant doesn't exist, push it to the new variants array
                updatedVariants.push({
                    color: variant.color,
                    size: variant.size,
                    stock: variant.stock,
                    regularPrice: variant.regularPrice,
                    salePrice: variant.salePrice || null,
                    status: variant.stock === 0 ? "Out of Stock" : "Available",
                });
            }
        }

        // If there are new variants to add
        if (updatedVariants.length > 0) {
            await Product.findByIdAndUpdate(
                id,
                {
                    $push: { variants: { $each: updatedVariants } }, // Add new variants to the variants array
                },
                { new: true }
            );
        }

        // Handle image files (if provided)
        const images = req.files && req.files.length > 0
            ? req.files.map(file => file.filename)
            : [];

        // Prepare the update fields for the product
        const updateFields = {
            productName: data.productName,
            description: data.description,
            category: data.category,  // category is a reference to Category _id
            productOffer: data.productOffer,
        };

        if (images.length > 0) {
            // Add new images to the existing product
            await Product.findByIdAndUpdate(
                id,
                {
                    ...updateFields,
                    $push: { productImage: { $each: images } },
                },
                { new: true }
            );
        } else {
            // Update product without new images
            await Product.findByIdAndUpdate(id, updateFields, { new: true });
        }

        // Flash success and redirect
        req.flash("success", "Product updated successfully!");
        res.redirect("/admin/products");

    } catch (error) {
        console.error("Error updating product:", error);
        res.redirect("/pageerror");
    }
};


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

const removeVariant = async (req, res) => {
    const { productId, variantIndex } = req.params;

    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // Check if the variantIndex is within the range of variants
        if (variantIndex >= product.variants.length || variantIndex < 0) {
            return res.status(400).json({ success: false, message: 'Invalid variant index.' });
        }

        if (product.variants.length <= 1) {
            return res.status(400).json({ success: false, message: "Cannot remove the last variant of a product." });
        }

        // Remove the variant at the given index
        product.variants.splice(variantIndex, 1); // Removes the variant at the given index

        // Save the updated product
        await product.save();

        res.json({ success: true, message: 'Variant removed successfully.' });
    } catch (error) {
        console.error('Error removing variant:', error);
        res.status(500).json({ success: false, message: 'An error occurred while removing the variant.' });
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

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/products");
        }

        res.render("admin-product-details", { product });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
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
    removeVariant
}