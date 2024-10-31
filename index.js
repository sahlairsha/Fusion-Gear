const express = require('express');
const session = require('express-session');
const passport = require('./config/passport')
const MongoDBStore = require('connect-mongodb-session')(session);
const path = require('path');
const dotenv = require('dotenv').config();
const db = require('./config/db');

const app = express();

const store = new MongoDBStore({
    uri: process.env.MONGODB_URI, // Update with your MongoDB URI
    collection: 'sessions'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
    }
}));


app.use(passport.initialize());
app.use(passport.session());




app.use((req, res, next) => {
    res.set('cache-control', 'no-store');
    next();
});

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'Public')));
app.use(require('./routes/userRouter'));

// Connect to MongoDB
db();

app.listen(process.env.PORT, () => {
    console.log('Server Running');
});

module.exports = app;
