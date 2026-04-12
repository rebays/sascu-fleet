const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const catchAsync = require('../utils/catchAsync');


const resend = new Resend(process.env.RESEND_API_KEY);


const register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  console.log(req.body);

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Name, email and password are required',
    });
  }

  // Optional: extra password length check
  if (password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters',
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword, phone });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// Forgot Password – send reset email
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: 'No user found with that email' });
  }

  // Generate secure reset token
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Save token + expiry to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Build reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Send email with Resend
  try {
    const { data, error } = await resend.emails.send({
      from: 'SASCU Rental <onboarding@resend.dev>', // Use your verified domain or Resend default
      to: user.email,
      subject: 'SASCU Rental - Password Reset Request',
      html: `
        <h2>Reset Your Password</h2>
        <p>Hello ${user.name || 'User'},</p>
        <p>You requested a password reset for your SASCU Rental account.</p>
        <p>Click the button below to set a new password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>SASCU Rental Team</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Reset email sent:', data.id);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
});

// Reset Password – validate token & update password

 const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});


module.exports = { register, login, forgotPassword, resetPassword };