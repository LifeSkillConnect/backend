import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
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

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const dbUser = await db.user.findUnique({ email: user.email! });

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
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
