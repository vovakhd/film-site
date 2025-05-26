import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define a custom property 'user' on Express Request object
// This allows us to attach the decoded user payload to the request
export interface AuthenticatedRequest extends Request {
  user?: string | jwt.JwtPayload; // or a more specific user type
}

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('AuthMiddleware triggered'); 

  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader);

  if (!JWT_SECRET) {
    console.error("AuthMiddleware: JWT_SECRET is not defined!");
    // Важливо не надсилати відповідь клієнту, якщо секрет не налаштовано на сервері,
    // а логувати критичну помилку і, можливо, зупиняти додаток або повертати загальну помилку сервера.
    // process.exit(1); // Або інший механізм обробки критичної помилки конфігурації
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Витягти токен після "Bearer "
    console.log('Token extracted:', token);

    if (!token) {
      console.log('No token part after Bearer');
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', err.message, 'Token tried:', token);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = decoded;
      console.log('Token verified, user:', decoded);
      next();
    });
  } else {
    console.log('No token provided or incorrect format (missing Bearer prefix)');
    return res.status(401).json({ message: 'Authorization token is required and must be Bearer type' });
  }
};

export default authMiddleware; 