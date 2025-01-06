
const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt')



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
            res.render('admin-profile', { user : req.session.admin })
        }else{
            console.log("Some Error Occure to load the profile page")
            res.redirect('/admin/login')
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

        const passwordMatch = await bcrypt.compare(password, findAdmin.password);
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


const generateReport = async(req,res)=>{
    const { startDate, endDate, reportType } = req.body;

    try {
        let matchQuery = {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            order_status: { $ne: 'Canceled' } // Exclude canceled orders
        };

        // Aggregation logic to calculate sales report
        const salesReport = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { 
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } // Group by day
                    },
                    salesCount: { $sum: 1 }, // Count orders
                    totalOrderAmount: { $sum: "$total_price" }, // Sum of total prices
                    totalDiscount: { $sum: { $subtract: ["$total_price", { $multiply: ["$total_price", 0.1] }] } } // Example discount logic (10% off)
                }
            },
            { $sort: { _id: 1 } } // Sort by date
        ]);

        res.json(salesReport); // Send the aggregated data back to the client
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).send("Error generating sales report");
    }
}








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


const downloadPdf = async (req, res) => {
    const { startDate, endDate } = req.query;

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    // Fetch data for the report
    const data = await Order.aggregate([
        { 
            $match: {
                order_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            $group: {
                _id: null,
                salesCount: { $sum: 1 },
                totalOrderAmount: { $sum: '$total_price' },
                totalDiscount: { $sum: '$discount' }
            }
        }
    ]);
  console.log("Aggregation Result:", data);
    // Add content to the PDF document
    doc.text(`Sales Report: ${startDate} to ${endDate}`, { align: 'center', fontSize: 16 });

    // Add table header
    doc.text('Sales Count', 50, 100);
    doc.text('Total Order Amount', 150, 100);
    doc.text('Total Discount', 300, 100);

    // Add data row
    doc.text(data.salesCount, 50, 120);
    doc.text(data.totalOrderAmount, 150, 120);
    doc.text(data.totalDiscount, 300, 120);

    // Draw lines to simulate a table
    doc.moveTo(50, 110).lineTo(550, 110).stroke(); // Header line
    doc.moveTo(50, 130).lineTo(550, 130).stroke(); // Data line

    // End and send the PDF document
    doc.end();
    doc.pipe(res);
};

const downloadExcel = async (req, res) => {
    const { startDate, endDate } = req.query;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Fetch data for the report
    const data = await Order.aggregate([
        { 
            $match: {
                order_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            $group: {
                _id: null,
                salesCount: { $sum: 1 },
                totalOrderAmount: { $sum: '$total_price' },
                totalDiscount: { $sum: '$discount' }
            }
        }
    ]);

    // Add header row
    worksheet.addRow(['Sales Count', 'Total Order Amount', 'Total Discount']);
    
    // Add data row
    worksheet.addRow([data.salesCount, data.totalOrderAmount, data.totalDiscount]);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

    // Write the Excel file to the response
    await workbook.xlsx.write(res);
    res.end();
}




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


