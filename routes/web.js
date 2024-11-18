const passport = require('passport');
const authController = require("../app/controller/authController")
const isLoggedIn = require('../app/middleware/guest')


function initRoutes(app){
app.get('/signin',authController().signin)
app.post('/signin',authController().postSignin)
app.get('/',authController().signup)
app.post('/',authController().postSignup)
app.post('/logout',authController().logout)
app.get('/reset',authController().reset)
app.post('/reset',authController().resetPassword)
app.get('/home',isLoggedIn,authController().home)


// Google Authentication
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' 
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signin' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/home'); 
    }
);

}
module.exports = initRoutes