// routes/ownerRoutes.js
const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

// Middleware to ensure user is logged in AND has 'owner' role
router.use((req, res, next) => {
    if (req.session.user && req.session.user.role === 'owner') {
        next();
    } else {
        res.redirect('/login?error=owner_required'); 
    }
});

router.get('/dashboard', ownerController.getOwnerDashboard);
router.get('/reports', ownerController.getOwnerReports);

module.exports = router;