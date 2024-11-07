const express = require('express');
const session = require('express-session');
const sessionStore = require('connect-mongo');
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
    store: sessionStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60 // 24 hours in seconds
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    }
}));

app.use(flash());
// Middleware to make flash messages available in all templates
app.use((req, res, next) => {
    res.locals.flash = req.flash();
    next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.set('cache-control', 'no-store');
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
