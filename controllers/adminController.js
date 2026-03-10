// controllers/adminController.js
const db = require('../models/db');

// --- 1. Dashboard Metrics ---

exports.getAdminDashboard = async (req, res) => {
    try {
        const [totalParked] = await db.execute('SELECT COUNT(*) AS total FROM Parking_Records WHERE check_out_time IS NULL');
        res.render('admin/admin_dashboard', { 
            title: 'Admin Panel', 
            user: req.session.user, 
            totalParked: totalParked[0].total, 
            error: null 
        });
    } catch (error) {
        console.error('Admin Dashboard error:', error);
        res.render('admin/admin_dashboard', { 
            title: 'Admin Panel', 
            user: req.session.user, 
            totalParked: 0, 
            error: 'Failed to load dashboard metrics.' 
        });
    }
};

// --- 2. Parking Records (Search & Read) ---

exports.getParkingRecords = async (req, res) => {
    const searchQuery = req.query.search || '';
    // Base query joins Records with Users for customer name
    let query = 'SELECT T1.*, T2.username FROM Parking_Records T1 JOIN Users T2 ON T1.user_id = T2.user_id';
    let params = [];
    
    if (searchQuery) {
        // Search functionality
        query += ' WHERE T1.vehicle_number LIKE ? OR T2.username LIKE ?';
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ' ORDER BY T1.check_in_time DESC';

    try {
        const [records] = await db.execute(query, params);
        res.render('admin/parking_records', { 
            title: 'All Parking Records', 
            user: req.session.user, 
            records: records, 
            searchQuery: searchQuery, 
            error: null
        });
    } catch (error) {
        console.error('Records read error:', error);
        res.render('admin/parking_records', { 
            title: 'Records', 
            user: req.session.user, 
            records: [], 
            searchQuery: searchQuery, 
            error: 'Failed to load records.' 
        });
    }
};

// --- 3. Record Deletion (CRUD Delete) ---

// controllers/adminController.js (FIXED deleteRecord)
// ... (rest of the file)

exports.deleteRecord = async (req, res) => {
    const recordId = req.params.recordId;
    try {
        // Simple DELETE command for the stable schema
        await db.execute('DELETE FROM Parking_Records WHERE record_id = ?', [recordId]);
        res.redirect('/admin/records?delete=success');
    } catch (error) {
        console.error('Record deletion failed:', error);
        res.redirect('/admin/records?delete=failed');
    }
};

// ... (rest of the file)

// controllers/adminController.js (ULTIMATE REVENUE FIX)

// ... (other functions) ...

exports.getRevenueReport = async (req, res) => {
    try {
        const [revenue] = await db.execute(`
            SELECT 
                DATE(check_out_time) AS report_date, 
                -- CRITICAL FIX: Use IFNULL and CAST to guarantee the SUM returns 0.00
                IFNULL(CAST(SUM(rate_paid) AS DECIMAL(10, 2)), 0.00) AS total_revenue, 
                COUNT(*) AS total_transactions
            FROM Parking_Records 
            WHERE rate_paid IS NOT NULL 
            GROUP BY report_date 
            ORDER BY report_date DESC
            LIMIT 7
        `);
        
        // This map is essential to safely convert the database result type before passing to EJS
        const fixedRevenueData = revenue.map(data => ({
            ...data,
            total_revenue: parseFloat(data.total_revenue) || 0.00 
        }));

        res.render('admin/revenue_report', { title: 'Revenue Report', user: req.session.user, revenueData: fixedRevenueData, error: null });
    } catch (error) {
        console.error('Revenue report error:', error);
        res.render('admin/revenue_report', { title: 'Revenue Report', user: req.session.user, revenueData: [], error: 'Failed to generate report.' });
    }
};
// --- 5. Spot Availability (Static View) ---

exports.getSpotAvailability = (req, res) => {
    res.render('admin/spot_availability', { title: 'Spot Availability Map', user: req.session.user, error: null });
};

// --- 6. Manage Users (CRUD Delete on Users Table) ---

exports.getManageUsers = async (req, res) => {
    try {
        // Fetch all non-admin users for management
        const [users] = await db.execute("SELECT user_id, username, email, phone, role, date_joined FROM Users WHERE role != 'admin' ORDER BY user_id DESC");
        
        res.render('admin/manage_users', { 
            title: 'Manage Customer Accounts', 
            user: req.session.user, 
            customerUsers: users,
            error: null
        });
    } catch (error) {
        console.error('Manage Users load error:', error);
        res.render('admin/manage_users', { 
            title: 'Manage Customer Accounts', 
            user: req.session.user, 
            customerUsers: [], 
            error: 'Failed to load user list.' 
        });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.userId;
    
    try {
        // Must delete associated parking records first due to Foreign Key constraint
        await db.execute('DELETE FROM Parking_Records WHERE user_id = ?', [userId]);
        
        // Then delete the User account
        await db.execute('DELETE FROM Users WHERE user_id = ?', [userId]);
        
        res.redirect('/admin/users?delete=success');
    } catch (error) {
        console.error('User deletion failed:', error);
        res.redirect('/admin/users?delete=failed');
    }
};