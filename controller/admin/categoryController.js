const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');



const inputCategories = async(req,res)=>{
    try {
        const adminData = await User.findById(req.session.admin)
        return res.render('addCategory',{admin:adminData})
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

        const adminData = await User.findById(req.session.admin)
        res.render("category",{
            category : categoryData ,   
            currentPage : page,
            totalPages : totalPages,
            totalCategories : totalCategories,
            admin: adminData
        })

    } catch (error) {

        console.error("There is error in category page",error);
        res.redirect('/pageerror')
    }
}


const addCategories = async (req, res) => {
    try {
      const { name, description, percentage, startDate, endDate } = req.body;
      
      const newCategory = new Category({ 
        name,
        description,
        categoryDiscount: {
          percentage: percentage,
          startDate: startDate,
          endDate: endDate
        }
      });
      
      await newCategory.save();
  
      req.flash('success', 'Category added successfully!');
      res.redirect('/admin/addCategory');
    } catch (error) {
      if (error.name === 'ValidationError') {
        req.flash('error', error.message);
      } else {
        req.flash('error', 'An unexpected error occurred.');
      }
      res.redirect('/admin/addCategory');
    }
  };
  


const editCategories = async(req, res) => {
    try {
        const { id } = req.query;
        const { name, description, discount, startDate, endDate } = req.body;

        // Convert the startDate and endDate to Date objects
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Update the category with the provided data
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            {
                name,
                description,
                categoryDiscount: {
                    percentage: discount,
                    startDate: start,
                    endDate: end
                }
            },
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
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        await Category.updateOne(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: Date.now() } },
            { new: true }
        );
        return res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ success: false, message: "Error deleting category" });
    }
}


const restoreCategories = async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        
     
        await Category.updateOne(
            { _id: id, isDeleted: true },
            { $set: { isDeleted: false, deletedAt: null } }
        );
        
        return res.json({ success: true, message: "Category restored successfully" });
    } catch (error) {
        console.error("Error restoring category:", error);
        return res.status(500).json({ success: false, message: "Error restoring category" });
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