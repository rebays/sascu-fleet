
const express = require('express');
const { getVehicles, getVehicleById, getAvailableVehiclesByDateRange, getBookingDatesForVehicle, getConfirmedBookingDatesForVehicle, getActiveBookingsCount, createVehicle,updateVehicle,deleteVehicle } = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Public endpoints
router.get('/', getVehicles);
router.get('/available', getAvailableVehiclesByDateRange);
router.get('/:id/bookings', getBookingDatesForVehicle);
router.get('/:id/bookings/confirmed', getConfirmedBookingDatesForVehicle);
router.get('/:id', getVehicleById);


// Only admins can CRUD vehicles
router.get("/:id/active-bookings-count", protect, admin, getActiveBookingsCount);
router.post("/", protect, admin, createVehicle);
router.put("/:id", protect, admin, updateVehicle);
router.delete("/:id", protect, admin, deleteVehicle);

module.exports = router;
