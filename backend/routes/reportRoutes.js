// src/routes/reportRoutes.js
const express = require('express');
const {
  getDashboard,
  getRevenueReport,
  getTopVehicles,
  exportBookings,
  getRevenueByVehicleType,
  getBookingsExport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(protect, admin); // ← All reports admin-only

router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenueReport);
router.get('/revenue-by-type', getRevenueByVehicleType);
router.get('/top-vehicles', getTopVehicles);
router.get('/export-csv', exportBookings);
router.get('/bookings-export', getBookingsExport);

module.exports = router;