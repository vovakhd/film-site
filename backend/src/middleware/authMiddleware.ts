import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define a custom property 'user' on Express Request object
// This allows us to attach the decoded user payload to the request
export interface AuthenticatedRequest extends Request {
  user?: string | jwt.JwtPayload; // or a more specific user type
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
      // Verify token
      // TODO: Use a proper secret key from environment variables
      const decoded = jwt.verify(token, 'your-secret-key'); 
      req.user = decoded; // Attach user payload to request object
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Token is not valid' });
      } else {
        return res.status(500).json({ message: 'Server error during token validation'});
      }
    }
  } else {
    return res.status(401).json({ message: 'No authorization header, authorization denied' });
  }
};

export default authMiddleware; 