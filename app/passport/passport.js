const LocalStrategy = require('passport-local').Strategy
const passport = require('passport');
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