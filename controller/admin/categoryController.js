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
        const { name, description,discount,startDate, endDate} = req.body;
        const newCategory = new Category({ name, description,discount,startDate, endDate});
        await newCategory.save();

        req.flash('success', 'Category added successfully!');
        res.redirect('/admin/addCategory');
    } catch (error) {
        if (error.name === 'ValidationError') {
           req.flash('error', error.message);
        } else {
            req.flash('error', 'An unexpected error occurred.');
        }
        res.redirect('/admin/addcategory');
    }
};



const editCategories = async(req,res) => {
    try {
        const { id } = req.query;
        const {name, description,discount,startDate, endDate} = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, description,discount,startDate, endDate },
            { new: true }
        );

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
        let id = req.query.id;
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        await Category.updateOne(
            {
                _id: id ,
                isDeleted : false
             },
             {$set : { isDeleted : true , deletedAt : Date.now()}},
             {new : true});
        res.redirect('/admin/category');
    } catch (error) {
        console.error("There is an error in deleting", error);
        res.status(500).redirect('/pageerror')
    }
}

const restoreCategories = async (req, res) => {
    try {
        let id = req.query.id;
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        await Category.updateOne(
            {
                _id: id,
                isDeleted : true
             },
             {$set : {isDeleted : false , deletedAt : null }},
             {new : true});
        res.redirect('/admin/category');
    } catch (error) {
        console.error("There is an error in restoring", error);
        res.status(500).redirect('/pageerror')
    }
}



module.exports = {
    categoryInfo,
    addCategories,
    editCategories,
    deleteCategories,
    restoreCategories,
    inputCategories,
}