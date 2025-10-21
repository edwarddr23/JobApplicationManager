import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

export interface AuthenticatedRequest extends Request {
  userId?: string; // changed from number → string
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });

    req.userId = decoded.userId;
    next();
  });
}
