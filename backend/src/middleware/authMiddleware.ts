import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define a custom property 'user' on Express Request object
// This allows us to attach the decoded user payload to the request
export interface AuthenticatedRequest extends Request {
  user?: string | jwt.JwtPayload; // or a more specific user type
}

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!JWT_SECRET) {
    console.error("AuthMiddleware: JWT_SECRET is not defined!");
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = decoded;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Authorization token is required and must be Bearer type' });
  }
};

export default authMiddleware; 