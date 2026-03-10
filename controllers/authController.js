// controllers/authController.js
const db = require('../models/db');
const bcrypt = require('bcryptjs');

// --- Helper Function ---
exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// --- AUTHENTICATION FUNCTIONS ---

exports.getSignup = (req, res) => {
    res.render('auth/signup', { title: 'Customer Sign Up', user: req.session.user, error: null });
};

exports.postSignup = async (req, res) => {
    const { username, email, password, phone } = req.body;
    const role = 'customer'; 
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const query = 'INSERT INTO Users (username, email, password, phone, role) VALUES (?, ?, ?, ?, ?)';
        await db.execute(query, [username, email, hashedPassword, phone, role]);
        res.redirect('/login');
    } catch (error) {
        console.error('Signup error:', error);
        res.render('auth/signup', { title: 'Customer Sign Up', user: null, error: 'Registration failed. Email/Username may be in use.' });
    }
};

exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'User Login', user: req.session.user, error: null });
};

// controllers/authController.js (TEMPORARY LOGIN BYPASS FOR ADMIN TEST)

// controllers/authController.js (ULTIMATE FIX - ADMIN PLAINTEXT BYPASS)

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        let [userRows] = await db.execute('SELECT user_id, username, password, role, email, phone FROM Users WHERE email = ?', [email]);
        let user = userRows[0];

        if (user) {
            
            // --- ULTIMATE FIX: PLAINTEXT BYPASS FOR ADMIN ONLY ---
            if (user.role === 'admin' && password === 'admin123') {
                 // Admin Login SUCCESS via plaintext check
                 req.session.user = { id: user.user_id, username: user.username, role: user.role, email: user.email, phone: user.phone };
                 return res.redirect('/admin/dashboard');
            }
            // --- END BYPASS ---

            // Standard Customer Login Check (uses bcrypt)
            const storedPassword = user.password.toString();
            if (await bcrypt.compare(password, storedPassword)) {
                // Customer Login SUCCESS
                req.session.user = { id: user.user_id, username: user.username, role: user.role, email: user.email, phone: user.phone };
                return res.redirect('/dashboard');
            }
        }
        
        // Login failed for any other case
        res.render('auth/login', { title: 'User Login', user: null, error: 'Invalid email or password.' });

    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', { title: 'User Login', user: null, error: 'An unexpected error occurred.' });
    }
};
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
};

// --- PROFILE UPDATE FUNCTIONS (CRUD UPDATE) ---

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT username, email, phone FROM Users WHERE user_id = ?', [req.session.user.id]);
        const userData = rows[0];

        res.render('customer/view_profile', {
            title: 'Update Profile',
            user: req.session.user,
            userData: userData,
            message: null,
            error: null
        });
    } catch (error) {
        console.error('Profile load error:', error);
        res.render('customer/view_profile', { title: 'Update Profile', user: req.session.user, userData: {}, message: null, error: 'Failed to load profile data.' });
    }
};

exports.postProfile = async (req, res) => {
    const { username, phone } = req.body;
    const userId = req.session.user.id;

    try {
        const query = 'UPDATE Users SET username = ?, phone = ? WHERE user_id = ?';
        await db.execute(query, [username, phone, userId]);

        // Update the session data immediately
        req.session.user.username = username;
        req.session.user.phone = phone;

        res.render('customer/view_profile', {
            title: 'Update Profile',
            user: req.session.user,
            userData: { username, phone, email: req.session.user.email },
            message: 'Profile updated successfully!',
            error: null
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.render('customer/view_profile', { 
            title: 'Update Profile', 
            user: req.session.user, 
            userData: req.body,
            message: null, 
            error: 'Failed to update profile. Try again.' 
        });
    }
};