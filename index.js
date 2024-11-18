require('dotenv').config()
const express =require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session')
const flash = require('express-flash')
const passport = require('./app/passport/passport')


//   **********  Initialize Express app  ********//
const app = express();

// *******************    Set Template Engine  ***********************************//

app.set("view engine","ejs")
app.set('views', path.join(__dirname, 'views'))
// console.log(app.get("view engine"))


// ************************  Database Connection  **********************************//
const {connectMonggose} = require('./app/database/db')
connectMonggose();



//*****************************  Session config   ************************************//
app.use(session({
    secret:  process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}))




// *********************   Passport Config   ***********************************//
app.use(passport.initialize());
app.use(passport.session());

app.use(flash())


// *************************    Assets    ****************************************//
const publicPath = path.join(__dirname,"public");
app.use(express.static(publicPath));
app.use(express.static(__dirname + '/public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// ***********************************Routes ********************************//
require('./routes/web')(app)

//*****   404 Error Handling   *******/ 
app.use((req, res) => {
    res.status(404).render('errors/error', { title: 'Page Not Found' })
})


// ************************   Port Start   ********************************//
const PORT = process.env.PORT || 8500;
app.listen(PORT,()=>{
    console.log(`My server start on this port ${PORT}`)
})


