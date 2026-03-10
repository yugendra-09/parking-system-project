// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;


// Configure EJS and Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session Middleware
app.use(session({
    secret: 'a_very_secret_key_for_parking_project_wt', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/', authRoutes);
app.use('/', customerRoutes); 
app.use('/admin', adminRoutes); 

// Root Route (Home Page) 
app.get('/', (req, res) => { 
    res.render('main/home', { title: 'Welcome Home', user: req.session.user });
}); 

// 404 Error Handler
app.use((req, res) => {
    res.status(404).render('main/404', { title: 'Page Not Found', user: req.session.user });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});