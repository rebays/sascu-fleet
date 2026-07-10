const express = require('express');
const { getMe, updateMe,getAllUsers,updateUser,deleteUser, toggleMembership, updatePassword, getAdmins, createAdmin, resetAdminPassword } = require('../controllers/userController');
const { protect} = require('../middleware/auth');
const admin = require('../middleware/admin');
const superAdmin = require('../middleware/superAdmin');

const router = express.Router();

router.use(protect); // All routes below need login
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/update-password', updatePassword);
router.get('/all', protect, admin, getAllUsers);
router.get('/admins', protect, superAdmin, getAdmins);
router.post('/admins', protect, superAdmin, createAdmin);
router.patch('/:id/reset-password', protect, superAdmin, resetAdminPassword);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.patch('/:id/toggle-membership', protect, admin, toggleMembership);

module.exports = router;