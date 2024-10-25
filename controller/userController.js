

const pageNotFound = async(req,res) =>{
    try {
        res.render("page-not-found")
    } catch (error) {
        res.status(500).send("Page is not found!!!")
    }
}




const loadHomePage = async(req,res)=>{
try {
    return res.render("home")
} catch (error) {
    console.log("Homepage is not found")
    res.status(500).send("Server Error")
}
}


module.exports = {
    loadHomePage,
    pageNotFound
}