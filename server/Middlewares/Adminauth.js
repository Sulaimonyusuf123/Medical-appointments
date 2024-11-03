const jwt = require('jsonwebtoken');


const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.admin = decoded; // Attach the decoded admin info to the request object
    next();
  });
};

module.exports = authenticateAdmin;
