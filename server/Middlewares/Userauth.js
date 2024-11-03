const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token required' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  console.log('Token:', token); // Debug: log token

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Error:', err); // Debug: log error
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded; // Attach the decoded user info to the request object
    next();
  });
};

module.exports = authenticateUser;
