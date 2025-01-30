const Brand = require('../../models/brandSchema');
const path = require('path');
const fs = require('fs')

const getAllBrands = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (page - 1) * limit;

        // Retrieve paginated brands
        const brands = await Brand.find({})
            .skip(skip)
            .limit(parseInt(limit));

        // Get the total number of brands for pagination calculations
        const totalBrands = await Brand.countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalBrands / limit);

        res.render('brand', {
            brands,
            currentPage: parseInt(page),
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};


const getAddBrand = async(req,res)=>{
   
    res.render('add-brand');

}

const addBrands = async (req, res) => {
    try {
        const { brand_name, description } = req.body;

        // Validate required fields
        if (!brand_name || !description || !req.file) {
            req.flash('error', 'All fields are required, including the logo.');
            return res.redirect('/admin/addBrand');
        }

        // Check for duplicate brand names
        const existingBrand = await Brand.findOne({ brand_name });
        if (existingBrand) {
            req.flash('error', 'Brand name already exists.');
            return res.redirect('/admin/addBrand');
        }

        // Create and save the new brand
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
        if(!brand)            
            return res.status(404).json({ message: 'Brand not found.'});
            res.render('edit-brand',{brand});
            
    }catch(error){
      console.log(error);
        res.status(500).json({ message: 'Server error. Could not find brand.' });
    }
}



const editBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, description } = req.body;

        // Find the brand by ID
        const brand = await Brand.findById(id);
        if (!brand) {
            req.flash('error', 'Brand not found.');
            return res.redirect('/admin/brands');
        }

        // Update fields
        brand.brand_name = brand_name.trim() || brand.brand_name;
        brand.description = description.trim() || brand.description;

        // Handle logo upload
        if (req.file) {
            // Dynamically get the root directory
            const rootDir = process.cwd();
            const logoDirectory = path.join(rootDir, 'Public', 'brand-logo');

            // Check if old logo exists before attempting to delete
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

        // Find and delete the brand
        const brand = await Brand.findByIdAndDelete(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found.' });
        }

        res.status(200).json({ message: 'Brand deleted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error. Could not delete brand.' });
    }
};


module.exports ={
    getAllBrands,
    addBrands,
    getAddBrand ,
    editBrand,
    getEditBrand,
    deleteBrand,
}