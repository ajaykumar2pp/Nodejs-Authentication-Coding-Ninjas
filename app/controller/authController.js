const User = require('../models/user')
const passport = require('passport')
const bcrypt = require('bcrypt')
const transporter = require('../database/nodemailer')
const nodemailer = require('nodemailer')
const crypto = require('crypto');

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

        // Forget Password Page
        forgetPasswordPage(req, resp) {
            resp.render('auth/forgetPassword')
        },

        // Forget Pasword POST
        async forgetPassword(req, res) {
            // console.log(req.body);
            try {
                const { email } = req.body;

                const user = await User.findOne({ email });
                console.log("user email", user.email)
                if (!user) {
                    req.flash('error', 'No account with that email found');
                    return res.redirect('/forget-password');
                }

                // const currentTime = Date.now();
                const token = crypto.randomBytes(32).toString('hex');
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // Expire 15 min

                // const timeRemaining = user.resetPasswordExpires - currentTime;
                // console.log("Time remaining (milliseconds):", timeRemaining);
                // console.log("Time remaining (minutes):", Math.floor(timeRemaining / 60000));


                await user.save();

                const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
                // console.log("Reset URL Link", resetUrl)

                // Send email
                const message = {
                    to: user.email,
                    from: process.env.EMAIL_USER,
                    subject: 'Password Reset',
                    html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #333;">You Requested a Password Reset</h2>
                     <p style="color: #555;">We received a request to reset the password for your account. Please click the link below to set a new password.</p>
                     <p style="color: #FF5733;">
                         <strong>This link will expire in 15 minutes.</strong>
                     </p>
                    <p>
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password
                        </a>
                    </p>
                    <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    <footer style="margin-top: 20px; font-size: 14px; color: #666;">
                        <p>Best regards,<br>IT Team, Gurukul Kangri University</p>
                    </footer>
                </div>
            `,
                };

                transporter.sendMail(message, (err, info) => {
                    if (err) {
                        console.error(err);
                        req.flash('error', 'Something went wrong while sending the email');
                        return res.redirect('/forget-password');
                    }


                    // console.log('Message sent successfully!');
                    // Log the message ID for confirmation
                    // console.log("Message sent: %s", info.messageId);

                    res.redirect('/check-email');
                });
            } catch (error) {
                console.error('Error processing password reset:', error);
                req.flash('error', 'An unexpected error occurred. Please try again later.');
                res.redirect('/forget-password');
            }
        },

        // Check email page
        checkEmail(req, resp) {
            resp.render('auth/checkEmail')
        },

        // Reset Password Page GET
        async resetPage(req, res) {

            try {
                const userToken = await User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: { $gt: Date.now() }
                });
                // console.log("User Token : ", userToken)

                if (!userToken) {
                    req.flash('error', 'Password reset token is invalid or has expired');
                    return res.redirect('/forget-password');
                }
                res.render('auth/resetPassword', { token: req.params.token });
            } catch (error) {
                console.error("Error fetching user token:", error);
                req.flash('error', 'An error occurred. Please try again.');
                res.redirect('/forget-password');
            }
        },

         async resetPassword (req, res){
            try {
                const { password, confirmPassword } = req.body;
                // console.log(req.body)

                if (password !== confirmPassword) {
                    req.flash('error', 'Passwords do not match');
                    return res.redirect(`/reset-password/${req.params.token}`);
                }

                const user = await User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: { $gt: Date.now() }
                });

                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired');
                    return res.redirect('/forget-password');
                }

                // Hash password 
                const hashedPassword = await bcrypt.hash(password, 10)

                user.password = hashedPassword;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();

                req.flash('success', 'Your password has been reset successfully!');
                res.redirect('/success');
            } catch (error) {
                console.error("Error resetting password:", error);
                req.flash('error', 'An error occurred while resetting the password. Please try again.');
                return res.redirect('/forget-password');
            }
        },

        // SuccessPage
        successPage (req, resp){
            resp.render('auth/successPassword')
        },

        // ************************************   LOGOUT   ********************************//
        logout(req, resp) {
            req.logOut((err) => {
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