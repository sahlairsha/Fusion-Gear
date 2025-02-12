
const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt')
const dayjs = require('dayjs')

const pageerror = async(req,res)=>{
    try {
        res.render('pageerror')
    } catch (error) {
        console.log("Page Error is not loading");
        res.status(500).send("Internal Server Error")
    }
}



const getProfile = async(req,res) =>{

        if(req.session.admin){
            const adminData = await User.findById(req.session.admin);

        
            res.render('admin-profile', {admin : adminData})
        }else{
            console.log("Some Error Occure to load the profile page")
            res.redirect('/admin/login',{admin:null})
        }
}


const loadLogin = async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin_profile")
        }
            res.render("admin-login",{message : req.flash('error')})
    } catch (error) {
        console.error("Error in loading login page",error)
        res.redirect("/pageerror")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const findAdmin = await User.findOne({ isAdmin: true, email });

        if (!findAdmin) {
            req.flash("error", "Admin not found. Please try again ")
            return res.redirect('/admin/login');
        }

        const passwordMatch =  bcrypt.compare(password, findAdmin.password);
        if (!passwordMatch) {
            req.flash("error", "Invalid Password! Try again.")
            return res.redirect("/admin/login");
        }

        req.session.admin = findAdmin._id;
        console.log(req.session.admin)

        res.redirect('/admin_profile');
    } catch (error) {
        console.error("Login Error", error);
        req.flash("error", "Login failed. Try again later.")
        res.redirect("/admin/login");
    }
};

const loadDashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            const adminData = await User.findById(req.session.admin)
            return res.render("dashboard",{admin:adminData})
        } else {
            return res.render("dashboard",{admin:null})
        }
    } catch (error) {
        console.log("Error loading dashboard", error);
        res.redirect('/pageerror');
    }
};








const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Error destroying session:', err);
            }
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.log("Unexpected error in logout",error);
        res.status(500).send("Internal Server Error")
    }
};


const generateReport = async (req, res) => {
    const { startDate, endDate, reportType } = req.body;

    try {
    const adjustedEndDate = dayjs(endDate).endOf('day').toDate();
const matchQuery = {
    createdAt: {
        $gte: new Date(startDate),
        $lte: adjustedEndDate  // now includes the full day
    },
    order_status: { $ne: 'Canceled' }
};


        const salesReport = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    salesCount: { $sum: 1 },
                    totalOrderAmount: { $sum: "$total_price" },
                    totalDiscount:  { $sum: "$discountAmount" }      
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(salesReport); 
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).send("Error generating sales report");
    }
};



const downloadPdf = async (req, res) => {
    const { startDate, endDate } = req.query;


    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    try {
        const data = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    order_status: { $ne: 'Canceled' }
                }
            },
            {
                $group: {
                    _id: null,
                    salesCount: { $sum: 1 },
                    totalOrderAmount: { $sum: '$total_price' },
                    totalDiscount: { $sum: '$discountAmount' }
                }
            }
        ]);

        const reportData = data.length > 0 ? data[0] : { salesCount: 0, totalOrderAmount: 0, totalDiscount: 0 };

        doc.fontSize(16).text(`Sales Report: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(12).text('Sales Count', 50, 100);
        doc.text('Total Order Amount', 150, 100);
        doc.text('Total Discount', 300, 100);

        doc.text(reportData.salesCount, 50, 120);
        doc.text(reportData.totalOrderAmount.toFixed(2), 150, 120);
        doc.text(reportData.totalDiscount.toFixed(2), 300, 120);

        doc.moveTo(50, 110).lineTo(550, 110).stroke(); 
        doc.moveTo(50, 130).lineTo(550, 130).stroke(); 

        doc.end();
        doc.pipe(res);
    } catch (error) {
        console.error("Error generating PDF report:", error);
        res.status(500).send("Error generating PDF report");
    }
};


const downloadExcel = async (req, res) => {
    const { startDate, endDate } = req.query;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    try {
        // Fetch data for the report
         const data = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    order_status: { $ne: 'Canceled' }
                }
            },
            {
                $group: {
                    _id: null,
                    salesCount: { $sum: 1 },
                    totalOrderAmount: { $sum: '$total_price' },
                    totalDiscount: { $sum: '$discountAmount' }
                }
            }
        ]);

        const reportData = data.length > 0 ? data[0] : { salesCount: 0, totalOrderAmount: 0, totalDiscount: 0 };

        // Add header row
        worksheet.addRow(['Sales Count', 'Total Order Amount', 'Total Discount']);

        // Add data row
        worksheet.addRow([
            reportData.salesCount,
            reportData.totalOrderAmount.toFixed(2),
            reportData.totalDiscount.toFixed(2)
        ]);

        // Auto-size columns only if headers exist
        worksheet.columns = [
            { header: 'Sales Count', key: 'salesCount', width: 15 },
            { header: 'Total Order Amount', key: 'totalOrderAmount', width: 20 },
            { header: 'Total Discount', key: 'totalDiscount', width: 15 }
        ];

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel report:", error);
        res.status(500).json({message : "Error generating Excel report"});
    }
};


module.exports = {
    loadLogin,
    getProfile,
    login,
    loadDashboard,
    pageerror,
    logout,
    generateReport,
    downloadPdf,
    downloadExcel
}


