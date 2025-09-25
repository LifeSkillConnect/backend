import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/supabase-database.service';

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Verify the custom JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (!decoded.userId || !decoded.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload'
      });
    }

    // Find user in database using the decoded email
    const dbUser = await db.user.findUnique({ email: decoded.email });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }

    req.userId = dbUser.id;
    req.userEmail = dbUser.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
