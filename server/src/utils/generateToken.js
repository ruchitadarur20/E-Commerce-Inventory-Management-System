const jwt = require('jsonwebtoken');

// Signs a JWT for the given user ID, valid for 7 days
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = generateToken;
