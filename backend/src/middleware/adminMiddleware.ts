import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware'; // Reuse AuthenticatedRequest

// Define a more specific type for user payload if needed, including role
// This interface should match the payload structure set during token signing in auth.ts
interface UserPayload {
  id: string;
  username: string;
  role: 'user' | 'admin';
  iat?: number; // Issued at (standard JWT claim)
  exp?: number; // Expiration time (standard JWT claim)
}

const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.error('AdminMiddleware: req.user is not populated. This should not happen if authMiddleware is correctly placed and working.');
    return res.status(401).json({ message: 'Authentication required but not provided or failed.' });
  }

  const user = req.user as UserPayload;

  if (user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

export default adminMiddleware; 