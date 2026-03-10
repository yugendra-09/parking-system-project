// controllers/customerController.js
const db = require('../models/db');

// Define advanced rates
const HOURLY_RATE = 50.00; // ₹50 per hour
const DAILY_MAX_RATE = 300.00; // ₹300 per 24-hour period

// --- Dashboard Functions ---

exports.getDashboard = async (req, res) => {
    try {
        // Simple SELECT: No JOIN needed as Lot_Name is not used in this stable schema
        const [records] = await db.execute(
            `SELECT * FROM Parking_Records WHERE user_id = ? 
             ORDER BY check_in_time DESC LIMIT 5`, 
            [req.session.user.id]
        );
        
        res.render('customer/dashboard', { 
            title: 'My Parking Dashboard', 
            user: req.session.user, 
            records: records,
            error: null 
        });
        
    } catch (error) {
        console.error('Dashboard load error:', error); 
        res.render('customer/dashboard', { 
            title: 'Dashboard', 
            user: req.session.user, 
            records: [], 
            error: 'Failed to load records. Database error.' 
        });
    }
};

exports.getCheckIn = (req, res) => {
    res.render('customer/check_in', { title: 'New Vehicle Check-In', user: req.session.user, error: null });
};

// --- Check-In Logic (Fixed for parking_spot_id) ---

exports.postCheckIn = async (req, res) => {
    // CRITICAL: Captures parking_spot_id, matching the stable schema
    const { vehicle_number, parking_spot_id } = req.body; 
    const user_id = req.session.user.id;
    const check_in_time = new Date();
    
    try {
        // SQL query uses the correct 'parking_spot_id' column
        const query = 'INSERT INTO Parking_Records (user_id, vehicle_number, check_in_time, parking_spot_id) VALUES (?, ?, ?, ?)';
        await db.execute(query, [user_id, vehicle_number, check_in_time, parking_spot_id]);
        
        res.redirect('/dashboard'); 
        
    } catch (error) {
        console.error('Check-in failed:', error);
        res.render('customer/check_in', { title: 'New Check-In', user: req.session.user, error: 'Check-in failed. Please try a different spot.' });
    }
};

// --- Check-Out Functions (Advanced Billing & Deletion) ---

exports.getCheckOut = async (req, res) => {
    const recordId = req.params.recordId;
    try {
        // Simple SELECT: No JOIN needed
        const [rows] = await db.execute('SELECT * FROM Parking_Records WHERE record_id = ? AND check_out_time IS NULL', [recordId]);
        const record = rows[0];

        if (!record) return res.redirect('/dashboard'); 

        const checkIn = new Date(record.check_in_time);
        const checkOut = new Date();
        const durationMs = checkOut - checkIn;
        const durationHours = durationMs / (1000 * 60 * 60);

        // --- ADVANCED FEE CALCULATION LOGIC ---
        const totalFullDays = Math.floor(durationHours / 24);
        const remainingHours = durationHours % 24;

        let calculatedFee = (totalFullDays * DAILY_MAX_RATE);
        let remainingFee = Math.ceil(remainingHours) * HOURLY_RATE;
        if (remainingFee > DAILY_MAX_RATE) { remainingFee = DAILY_MAX_RATE; }
        calculatedFee += remainingFee;
        // --- END ADVANCED FEE CALCULATION ---

        res.render('customer/check_out', { title: 'Process Check-Out', user: req.session.user, record: record, duration: durationHours.toFixed(2), fee: calculatedFee.toFixed(2) });
    } catch (error) {
        console.error('Checkout view error:', error);
        res.redirect('/dashboard');
    }
};

// controllers/customerController.js (FIXED postCheckOut with Deletion)

// ... (exports.getCheckOut remains the same) ...

// controllers/customerController.js (FIXED postCheckOut with Deletion)

// ... (exports.getCheckOut remains the same) ...

// controllers/customerController.js (FIXED postCheckOut: NO AUTODELETE)

// ... (exports.getCheckOut remains the same) ...

exports.postCheckOut = async (req, res) => {
    const recordId = req.params.recordId;
    const { final_fee, payment_method } = req.body; 

    try {
        // 1. Log the completion details (UPDATE: Setting CheckOutTime and Fee)
        await db.execute('UPDATE Parking_Records SET check_out_time = ?, rate_paid = ? WHERE record_id = ?', [new Date(), final_fee, recordId]);

        // 2. FETCH RECORD AFTER UPDATE (for receipt)
        const [paidRecordRows] = await db.execute('SELECT * FROM Parking_Records WHERE record_id = ?', [recordId]);
        const paidRecord = paidRecordRows[0];

        // 3. CRITICAL: IMMEDIATE DELETION IS REMOVED. Record now remains for Admin view.
        
        // 4. Redirect to the RECEIPT page
        res.render('customer/payment_receipt', { title: 'Payment Successful', user: req.session.user, record: paidRecord, paymentMethod: payment_method, transactionId: Math.floor(Math.random() * 10000000000) });
        
    } catch (error) {
        console.error('Check-out process failed:', error);
        res.redirect('/dashboard?checkout=failed');
    }
};

// ... (exports.getTariffRates remains the same) ... 

// ... (exports.getTariffRates remains the same) ...// ... (exports.getTariffRates remains the same) ...
exports.getTariffRates = (req, res) => {
    res.render('customer/tariff_rates', { title: 'Parking Rates', user: req.session.user });
};