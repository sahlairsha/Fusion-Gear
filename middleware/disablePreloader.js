const disablePreloader = (req,res,next) =>{
    res.locals.disablePreloader = false; 
    next();
}



module.exports = { disablePreloader }