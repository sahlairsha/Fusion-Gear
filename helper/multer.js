const multer = require('multer');
const path = require("path")


const storage = multer.diskStorage({
    destination : (req,res,cb)=>{
        cb(null,path.join(__dirname,"../Public/uploads/re-image"));
    },
    filename:(req,res,cb)=>{
        cb(null,Date.now()+"-"+file.orginalname)
    }
})


module.exports = storage