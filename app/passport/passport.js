const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user')


// Local Strategy for email and password login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {

    try {
        // console.log("Checking user with email:", email);

        // check if email exists
        const user = await User.findOne({ email });
        // console.log("User found:", user);

        if (!user) {
            return done(null, false, { message: 'Incorrect email' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }

        // If everything is fine, return the user
        return done(null, user, { message: 'Logged in succesfully' });
    } catch (err) {
        return done(null, false, { message: 'Something went wrong' })
    }
}));


// Google Strategy for OAuth authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://gkv-ac-in.onrender.com/auth/google/callback",
},
    async (accessToken, refreshToken, profile, done) => {
        // console.log(profile)
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                user = await new User({
                    googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    image: profile.photos[0].value,
                }).save();
            }
            return done(null, user);
        } catch (err) {
            console.error(err);
            done(err, null);
        }
    }));


// Serialize  user
passport.serializeUser((user, done) => {
    console.log("SerializeUser:", user);
    done(null, user.id);
});


// deserialize user
passport.deserializeUser( async(id, done) => {
    // console.log("DeserializeUser:", id);

    try {
        const user = await User.findById(id).select('-createdAt -updatedAt -__v');
        // console.log("DeserializeUser:", user);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;