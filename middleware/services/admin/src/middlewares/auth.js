const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.role || decoded.role !== 'ADMIN') return res.sendStatus(403);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};
