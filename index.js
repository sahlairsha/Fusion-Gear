const express = require('express');
const session = require('express-session');
const sessionStorage = require("connect-mongo")
const passport = require('./config/passport');
const path = require('path');
const env = require('dotenv').config();
const db = require('./config/db');
const nocache = require('nocache');
const flash = require('connect-flash');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(nocache());

app.use(session({
    secret: process.env.SESSION_SECRET,
    store:  sessionStorage.create({
        mongoUrl:process.env.MONGODB_URI,
        collectionName: 'sessions',
    }),
    resave: false,
    saveUninitialized: true,
    cookie:{secure : false}
}));

app.use(passport.initialize());
app.use(passport.session());



app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});


app.use(flash());
app.use((req, res, next) => {
    res.locals.flash = req.flash();
    next();
});





app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'Public')));
app.use(require('./routes/userRouter'));
app.use(require('./routes/adminRouter'));



// Connect to MongoDB
db();

app.listen(process.env.PORT, () => {
    console.log(`Server Running :'http://localhost:${process.env.PORT}'`);
});

module.exports = app;
