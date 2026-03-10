// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 
const customerController = require('../controllers/customerController');

router.use(authController.isLoggedIn); 

router.get('/dashboard', customerController.getDashboard);
router.get('/checkin', customerController.getCheckIn); 
router.post('/checkin', customerController.postCheckIn);
router.get('/checkout/:recordId', customerController.getCheckOut);
router.post('/checkout/:recordId', customerController.postCheckOut);
router.get('/tariff', customerController.getTariffRates);

// Routes for the Profile Update feature (CRUD UPDATE)
router.get('/profile', authController.getProfile); 
router.post('/profile', authController.postProfile);

module.exports = router;