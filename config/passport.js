const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
const env = require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: profile.id });


        if (!user) {


            // Generate an avatar URL using Gravatar or a default service
            const emailHash = profile.emails && profile.emails[0].value
                ? crypto.createHash('md5').update(profile.emails[0].value.trim().toLowerCase()).digest('hex')
                : null;
            
            const avatarUrl = emailHash 
                ? `https://www.gravatar.com/avatar/${emailHash}?d=robohash&r=g&s=200`
                : `https://www.gravatar.com/avatar/?d=robohash&r=g&s=200`; // Default avatar if email isn't available

            // Create a new user
            user = new User({
                full_name: profile.displayName,
                email: profile.emails[0]?.value || null, // Handle cases where email is not provided
                googleId: profile.id,
                profile_pic: avatarUrl, 
            });

            await user.save();
       
        }
            return done(null, user);

        

    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(error => {
            done(error, null);
        });
});

module.exports = passport;
