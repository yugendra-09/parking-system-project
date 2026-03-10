// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin role check middleware
router.use((req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).redirect('/login'); 
    }
});

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/records', adminController.getParkingRecords);
router.get('/reports/revenue', adminController.getRevenueReport);

// NEW ROUTES FOR USER MANAGEMENT
router.get('/users', adminController.getManageUsers);
router.post('/users/delete/:userId', adminController.deleteUser); 

router.post('/records/delete/:recordId', adminController.deleteRecord);
router.get('/spot-map', adminController.getSpotAvailability);

module.exports = router;