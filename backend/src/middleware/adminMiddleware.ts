import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware'; // Reuse AuthenticatedRequest

// Define a more specific type for user payload if needed, including role
// This interface should match the payload structure set during token signing in auth.ts
interface UserPayload {
  id: string;
  username: string;
  role: 'user' | 'admin';
  // Add any other fields that are in your JWT payload
  iat?: number; // Issued at (standard JWT claim)
  exp?: number; // Expiration time (standard JWT claim)
}

const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('AdminMiddleware triggered');
  // authMiddleware should have already run and populated req.user if the token was valid.
  // We just need to check the role on req.user.

  if (!req.user) {
    // This case should ideally not be reached if authMiddleware is correctly placed before adminMiddleware
    // and correctly calls next() only on successful auth.
    console.error('AdminMiddleware: req.user is not populated. authMiddleware might be missing or failed before adminMiddleware.');
    return res.status(401).json({ message: 'Authentication required but not provided or failed.' });
  }

  const user = req.user as UserPayload; // Type assertion based on the payload structure
  console.log('AdminMiddleware: Checking role for user:', user);

  if (user.role === 'admin') {
    console.log('AdminMiddleware: User is admin. Proceeding.');
    next(); // User is admin, proceed to the next handler
  } else {
    console.log('AdminMiddleware: User is not admin. Access denied.');
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

export default adminMiddleware; 