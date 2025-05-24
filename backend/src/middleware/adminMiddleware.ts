import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './authMiddleware'; // Reuse AuthenticatedRequest

// Define a more specific type for user payload if needed, including role
interface UserPayload extends jwt.JwtPayload {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // First, ensure user is authenticated (authMiddleware should have run or token is checked here)
  // For simplicity, we'll re-check token presence and basic verification like in authMiddleware
  // In a real app, you might chain middlewares or have authMiddleware set req.user reliably.

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied for admin route' });
    }

    try {
      // TODO: Use a proper secret key from environment variables
      const decoded = jwt.verify(token, 'your-secret-key') as UserPayload; 
      
      // Check if user has admin role
      if (decoded && decoded.role === 'admin') {
        req.user = decoded; // Attach user payload (which includes role) to request object
        next(); // Proceed if admin
      } else {
        return res.status(403).json({ message: 'User is not authorized to perform this action (not an admin)' });
      }
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Token is not valid for admin route' });
      } else {
        return res.status(500).json({ message: 'Server error during admin token validation' });
      }
    }
  } else {
    return res.status(401).json({ message: 'No authorization header, authorization denied for admin route' });
  }
};

export default adminMiddleware; 