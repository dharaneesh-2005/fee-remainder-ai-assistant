// Simple authentication middleware
const authenticate = (req, res, next) => {
  // For now, we'll use a simple username/password check
  // In production, this would be replaced with proper authentication
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Simple check for demo purposes
  // Format: Basic base64(username:password)
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Default credentials for demo
  if (username === 'admin' && password === 'admin123') {
    req.user = { id: 1, username: 'admin' };
    next();
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};

module.exports = authenticate;