const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema');
const path = require('path');
const fs = require('fs')

const getAllBrands = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (page - 1) * limit;

        
        const brands = await Brand.find({})
            .skip(skip)
            .limit(parseInt(limit))
            .sort({createdAt : -1})

        
        const totalBrands = await Brand.countDocuments();

       
        const totalPages = Math.ceil(totalBrands / limit);
       const adminData = await User.findById(req.session.admin)
        res.render('brand', {
            brands,
            currentPage: parseInt(page),
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            admin:adminData 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};


const getAddBrand = async(req,res)=>{

    const adminData = await User.findById(req.session.admin)
   
    res.render('add-brand',{admin: adminData});

}

const addBrands = async (req, res) => {
    try {
        const { brand_name, description } = req.body;

        
        if (!brand_name || !description || !req.file) {
            req.flash('error', 'All fields are required, including the logo.');
            return res.redirect('/admin/addBrand');
        }

        const existingBrand = await Brand.findOne({ brand_name });
        if (existingBrand) {
            req.flash('error', 'Brand name already exists.');
            return res.redirect('/admin/addBrand');
        }

        const newBrand = new Brand({
            brand_name,
            description,
            logo: `/brand-logo/${req.file.filename}`,
        });

        await newBrand.save();
        req.flash('success', 'Brand added successfully.');
        res.redirect('/admin/brands');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Server error. Could not add brand.');
        res.redirect('/admin/addBrand');
    }
};


const getEditBrand = async(req,res) =>{
    try{
        const brandId = req.params.id;
        const brand = await Brand.findById(brandId);
        const adminData = await User.findById(req.session.admin)
        if(!brand)            
            return res.status(404).json({ message: 'Brand not found.'});
            res.render('edit-brand',{brand , admin: adminData});
            
    }catch(error){
      console.log(error);
        res.status(500).json({ message: 'Server error. Could not find brand.' });
    }
}



const editBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, description } = req.body;

     
        const brand = await Brand.findById(id);
        if (!brand) {
            req.flash('error', 'Brand not found.');
            return res.redirect('/admin/brands');
        }

  
        brand.brand_name = brand_name.trim() || brand.brand_name;
        brand.description = description.trim() || brand.description;

   
        if (req.file) {
           
            const rootDir = process.cwd();
            const logoDirectory = path.join(rootDir, 'Public', 'brand-logo');

            if (brand.logo) {
                const oldLogoPath = path.join(logoDirectory, path.basename(brand.logo));
                console.log('Old Logo Path:', oldLogoPath);

                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                } else {
                    console.log('Old logo file does not exist or was already deleted.');
                }
            } else {
                console.log('No previous logo found for this brand.');
            }

           
            brand.logo = `/brand-logo/${req.file.filename}`;
        }

        await brand.save();

        req.flash('success', 'Brand updated successfully.');
        res.redirect('/admin/brands');
    } catch (error) {
        console.error('Error updating brand:', error);
        req.flash('error', 'Server error. Could not update brand.');
        res.redirect('/admin/brands');
    }
};


const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.updateOne(
            { _id: id, isDeleted : false},
            { $set: { isDeleted: true, deletedAt: Date.now() } },
            { new: true }
    )
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found.' });
        }

        res.status(200).json({ message: 'Brand deleted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error. Could not delete brand.' });
    }
};


const restoreBrand = async(req,res)=>{
    try{
        const { id } = req.params;
        const brand = await Brand.updateOne(
            { _id: id, isDeleted: true },
            { $set: { isDeleted: false, deletedAt: null } },
            { new: true }
            );
            if (!brand) {
                return res.status(404).json({ message: 'Brand not found.' });
             }
             res.status(200).json({ message: 'Brand restored successfully.' });
          } catch (error) {
                    console.log(error);
                    res.status(500).json({ message: 'Server error. Could not restore brand.' });
          }
    
}


module.exports ={
    getAllBrands,
    addBrands,
    getAddBrand ,
    editBrand,
    getEditBrand,
    deleteBrand,
    restoreBrand 
}