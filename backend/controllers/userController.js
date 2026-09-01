const User = require('../models/User');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// controllers/userController.js
const toggleMembership = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Toggle
  user.isMember = !user.isMember;

  // Optional: set extra fields when becoming a member
  if (user.isMember) {
    user.membershipSince = new Date();
    // user.membershipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // e.g. 1 year
    // user.membershipTier = 'basic';
  } else {
    user.membershipSince = null;
    user.membershipExpiresAt = null;
    user.membershipTier = 'none';
  }

  await user.save();

  res.json({
    success: true,
    message: `User is now ${user.isMember ? 'a member' : 'not a member'}`,
    data: {
      _id: user._id,
      isMember: user.isMember,
      membershipSince: user.membershipSince,
      membershipExpiresAt: user.membershipExpiresAt,
      membershipTier: user.membershipTier
    }
  });
});

const updateMe = catchAsync(async (req, res) => {
  const updates = (({ name, phone }) => ({ name, phone }))(req.body);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json(user);
});
const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find()
    .select('-password') // never send password
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, memberId } = req.body;

  // Prevent changing role via this route (use separate endpoint if needed)
  if (req.body.role) {
    return res.status(400).json({
      message: 'Use dedicated endpoint to change user role',
    });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { name, email, phone, memberId },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({
    success: true,
    data: user,
  });
});

// Super admin only: change a user's role
const changeUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ['user', 'admin', 'superadmin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    success: true,
    message: `${user.name}'s role updated to ${role}`,
    data: user,
  });
});

//Admin only
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Optional: Prevent deleting yourself
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }

  // Optional: Prevent deleting other admins
  if (user.role === 'admin' || user.role === 'superadmin') {
    return res.status(400).json({ message: 'Cannot delete admin accounts' });
  }

  await User.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Super admin only: list admin + super admin accounts
const getAdmins = catchAsync(async (req, res) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('-password')
    .sort({ role: 1, createdAt: -1 });

  res.json({ success: true, count: admins.length, data: admins });
});

// Super admin only: create a new admin account
const createAdmin = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: 'A user with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: 'admin',
  });

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
    },
  });
});

// Super admin only: reset any user's password (admin, superadmin, or customer)
const resetAdminPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const target = await User.findById(id);
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Super admins reset their own password via the regular "update password" flow.
  if (target._id.toString() === req.user.id) {
    return res.status(400).json({ message: 'Use your account settings to change your own password' });
  }

  target.password = await bcrypt.hash(newPassword, 12);
  await target.save();

  res.json({ success: true, message: `Password reset for ${target.name}` });
});

const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user.id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid current password' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { getMe, updateMe, getAllUsers, updateUser, deleteUser, toggleMembership, updatePassword, getAdmins, createAdmin, resetAdminPassword, changeUserRole };