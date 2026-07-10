const superAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      message: 'Super admin access required',
      currentRole: req.user.role || 'none',
    });
  }
  next();
};

module.exports = superAdmin;
