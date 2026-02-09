const { requireAuth } = require('./requireAuth');

const adminAuth = async (req, res, next) => {
  return requireAuth(req, res, () => {
    if (req.profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  });
};

module.exports = { adminAuth };
