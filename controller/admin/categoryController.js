const Category = require('../../models/categorySchema');

const Products = require('../../models/productSchema')


const inputCategories = async(req,res)=>{
    try {
        return res.render('addCategory')
    } catch (error) {
        console.error('error in loading the add category page',error)
        res.status(500).json({error : "Internal Server Error"})
    }
}

const categoryInfo = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1) * limit

        const totalCategories = await Category.countDocuments();

        const categoryData = await Category.find({})
        .sort({createdAt : -1})
        .skip(skip)
        .limit(limit)

        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category",{
            category : categoryData ,
            currentPage : page,
            totalPages : totalPages,
            totalCategories : totalCategories
        })

    } catch (error) {

        console.error("There is error in category page",error);
        res.redirect('/pageerror')
    }
}


const addCategories = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            req.flash('error', 'Category already exists!');
            return res.redirect('/admin/addcategory'); 
        }

        // Save new category
        const newCategory = new Category({ name, description });
        await newCategory.save();

        req.flash('success', 'Category added successfully!');
        res.redirect('/admin/category');
    } catch (error) {
        console.error("Error in adding new category:", error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/admin/addcategory');
    }
};


const editCategories = async(req,res) => {
    try {
        const { id, name, description } = req.query;

        const updatedCategory = await Category.findByIdAndUpdate(id, { name, description }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.json({ message: "Category updated successfully", category: updatedCategory });

    } catch (error) {
        console.error("There is an error in category editing", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const deleteCategories = async (req, res) => {
    try {
        let {id} = req.query;
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        await Category.deleteOne({ _id: id });
        res.redirect('/admin/category');
    } catch (error) {
        console.error("There is an error in deleting", error);
        res.status(500).redirect('/pageerror')
    }
}



const addOffer = async(req,res)=>{
    try{

        const percentage = parseInt(req.body.percentage)
        const categoryId = req.body.categoryId;

        const category = await Category.findById(categoryId);
        if(!category){
            res.status(404).json({status : false , message : "Category Not Found"})
        }
        const products = await Products.find({category : category._id})

        const hasProductOffer = products.some((product)=> product.productOffer > percentage)
        if(hasProductOffer){
            return res.json({status : false , message : "Product within this category already have product offer"})
        }

        await Category.updateOne({_id : categoryId},{$set :{categoryOffer : percentage}});

        for(const product of products){
            product.productOffer = 0;
            product.salePrice = product.regularPrice;
            await product.save()
        }

        res.json({status : true})

    }catch(error){
        res.status(500).json({status : false , message : "Internal Server Error"})
    }
}



const removeOffer = async(req,res)=>{
    try{

        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(404).json({status : false , message : "Category not Found"})
        }

        const percentage = category.categoryOffer;
        const products = await Products.find({category : category._id})

        if(products.length > 0){
            for(const product of products){
                product.salePrice += Math.floor(product.regularPrice * (percentage/100));
                product.productOffer = 0;
                await product.save()
            }
        }

        category.categoryOffer = 0
        await category.save();
        res.json({status : true})

    }catch(error){
        res.status(500).json({status : false , message : "Internal Server Error"})
    }
}


const listedCategories = async(req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id :id},{$set : {isListed : true}})
        res.redirect('/admin/category')
    } catch (error) {
        console.log('Error in blocking user',error)
        res.redirect('/pageerror')
    }
}



const unlistedCategories = async(req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id :id},{$set : {isListed : false}})
        res.redirect('/admin/category')
    } catch (error) {
        console.log('Error in blocking user',error)
        res.redirect('/pageerror')
    }
}



module.exports = {
    categoryInfo,
    addCategories,
    editCategories,
    deleteCategories,
    inputCategories,
    addOffer,
    removeOffer,
    listedCategories,
    unlistedCategories
}