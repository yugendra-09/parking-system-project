// controllers/ownerController.js
const db = require('../models/db');

exports.getOwnerDashboard = async (req, res) => {
    const lotId = req.session.user.lotId;
    
    try {
        // Fetch specific lot data
        const [lotData] = await db.execute('SELECT lot_name, location, total_capacity, current_occupancy FROM Parking_Lots WHERE lot_id = ?', [lotId]);
        
        // Count total revenue for this lot
        const [revenue] = await db.execute('SELECT SUM(rate_paid) AS total_revenue, COUNT(record_id) AS total_records FROM Parking_Records WHERE lot_id = ?', [lotId]);

        // FIX: Use parseFloat() on database SUM results to ensure it is treated as a number.
        // This is necessary because database aggregations can return non-standard types.
        const totalRevenue = parseFloat(revenue[0].total_revenue) || 0.00; 
        const recordsCount = revenue[0].total_records || 0;


        res.render('owner/dashboard', {
            title: 'Owner Dashboard',
            user: req.session.user,
            lotInfo: lotData[0] || {},
            revenue: totalRevenue, // Use the corrected variable
            recordsCount: recordsCount,
            error: null 
        });
    } catch (error) {
        console.error('Owner Dashboard load error:', error);
        res.render('owner/dashboard', { 
            title: 'Owner Dashboard', 
            user: req.session.user, 
            lotInfo: {}, 
            revenue: 0, 
            recordsCount: 0, 
            error: 'Failed to load data. Check server console for SQL details.' 
        });
    }
};

exports.getOwnerReports = async (req, res) => {
    const lotId = req.session.user.lotId;
    
    try {
        // Fetch all parking records for the specific lot that have been checked out
        const [records] = await db.execute(
            `SELECT * FROM Parking_Records 
             WHERE lot_id = ? AND check_out_time IS NOT NULL 
             ORDER BY check_out_time DESC`,
            [lotId]
        );

        // Ensure you render the correct EJS file: views/owner/reports.ejs
        res.render('owner/reports', { 
            title: 'Detailed Revenue Report', 
            user: req.session.user,
            records: records,
            error: null
        });
    } catch (error) {
        console.error('Owner Reports load error:', error);
        res.render('owner/reports', { 
            title: 'Detailed Revenue Report', 
            user: req.session.user,
            records: [],
            error: 'Failed to load detailed report data.'
        });
    }
};