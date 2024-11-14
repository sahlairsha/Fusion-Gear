const flashMessage = (req, res, next) => {
    res.locals.flash = req.flash();
    next();
}

module.exports = { flashMessage }