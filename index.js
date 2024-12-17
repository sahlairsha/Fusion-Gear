const express = require('express');
const session = require('express-session');
const sessionStorage = require("connect-mongo")
const passport = require('./config/passport');
const path = require('path');
const env = require('dotenv').config();
const db = require('./config/db');
const nocache = require('nocache');
const flash = require('connect-flash');
const { cacheControl } = require("./middleware/cache-control")
const {flashMessage} = require("./middleware/flash")
const {setUserInfo} = require("./middleware/userInfo")
const {disablePreloader} = require("./middleware/disablePreloader")

const methodOverride = require("method-override");


const cors = require("cors")

const app = express();

app.use(cors());

app.use(methodOverride("_method"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(nocache());

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStorage.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
    }),
    resave: false,
    saveUninitialized: false,
    cookie:{
        secure : false,
        httpOnly : true,
        maxAge : 72 * 60 * 60 * 1000
    }
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(setUserInfo)
app.use(cacheControl)

app.use(flash());
app.use(flashMessage);

app.use(disablePreloader);




app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'Public')));




//Routes for the User and Admin
app.use(require('./routes/userRouter'));
app.use(require('./routes/adminRouter'));



// Connect to MongoDB
db();

app.listen(process.env.PORT, () => {
    console.log(`Server Running :'http://localhost:${process.env.PORT}'`);
});

module.exports = app;
