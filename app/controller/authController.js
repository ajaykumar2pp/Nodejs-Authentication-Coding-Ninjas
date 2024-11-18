const User = require('../models/user')
const passport = require('passport')
const bcrypt = require('bcrypt')

function authController() {
    return {
        // ************************************  SIGN IN SETUP  *********************************//
        signin(req, resp) {
            resp.render('auth/signin')
        },

        postSignin(req, resp, next) {
            const { email, password } = req.body
            console.log(req.body)
            // Validate request 
            if (!email || !password) {
                req.flash('error', 'All fields are required')
                req.flash('email', email)
                return resp.redirect('/signin')

            }
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    req.flash('error', 'Something went wrong. Please try again.');
                    return resp.redirect('/signin')
                }
                if (!user) {
                    req.flash('error', info.message || 'Invalid login credentials');
                    return resp.redirect('/signin')
                }

                 // Login user and redirect to dashboard
                req.logIn(user, (err) => {
                    if (err) {
                        req.flash('error', 'Login failed. Please try again.')
                        return resp.redirect('/signin');
                    }

                    return resp.redirect('/home');
                })
            })(req, resp, next)
        },

        home(req, resp) {
            resp.render('auth/home', { user: req.user })
        },


// ******************************************   SIGNUP SETUP  ********************************//
        signup(req, resp) {
            resp.render('auth/signup')
        },

         async postSignup(req, resp) {
            const { username, email, password } = req.body
            console.log(req.body);
            if (!username || !email || !password) {
                req.flash('error', 'All fields are required')
                req.flash('username', username)
                req.flash('email', email)
                return resp.redirect('/')
            }
           
            try {
                // Check if email exists
                const emailExists = await User.exists({ email: email });
                if (emailExists) {
                    req.flash('error', 'Email already taken');
                    req.flash('username', username);
                    req.flash('email', email);
                    return resp.redirect('/');
                }
        
                // Hash password 
                const hashedPassword = await bcrypt.hash(password, 10)
        
                // Create a user 
                const user = new User({
                    username,
                    email: email.toLowerCase(),
                    password: hashedPassword
                })
        
                // Save the user
                await user.save();
        
                // Redirect to login Page
                // req.flash('success', 'Registration successful! ');
                return resp.redirect('/signin');
        
            } catch (err) {
                console.error(err);
                req.flash('error', 'Something went wrong, please try again.');
                return resp.redirect('/');
            }
        },

        // *****************************************   RESET PASSWORD SETUP  *************************//
        reset(req, resp) {
            resp.render('auth/reset')
        },

        resetPassword(req, resp) {
            User.findByUsername(req.body.username, (err, user) => {
                if (err) {
                    req.flash('error', 'plz check your password')
                } else {
                    user.changePassword(req.body.oldpassword,
                        req.body.newpassword, function (err) {
                            if (err) {
                                return resp.redirect('/reset');
                            } else {
                                return resp.redirect('/signin')
                            }
                        });
                }
            });
        },
        // ************************************   LOGOUT   ********************************//
        logout(req, resp) {
            req.logOut((err) =>{ 
                if (err) {
                    console.error(err);
                    return resp.redirect('/dashboard');
                }
                return resp.redirect('/signin')
            });

        }


    }
}
module.exports = authController