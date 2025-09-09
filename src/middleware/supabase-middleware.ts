import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getPrismaUserBySupabaseId } from '../services/user-sync.service';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      supabaseUser?: any;
      userEmail?: string;
    }
  }
}

/**
 * Middleware to authenticate users using either:
 * 1. Your custom JWT tokens (legacy)
 * 2. Supabase JWT tokens (new)
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    // First, try to verify as a Supabase token
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        // This is a Supabase token
        const prismaUser = await getPrismaUserBySupabaseId(user.id);
        
        if (!prismaUser) {
          return res.status(404).json({
            success: false,
            error: 'User not found in database'
          });
        }
        
        req.userId = prismaUser.id;
        req.userEmail = prismaUser.email;
        req.supabaseUser = user;
        return next();
      }
    } catch (supabaseError) {
      // Not a Supabase token, try custom JWT
      console.log('Not a Supabase token, trying custom JWT...');
    }
    
    // Try to verify as a custom JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      
      if (decoded.userId) {
        // This is a custom JWT token
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        return next();
      }
    } catch (jwtError) {
      console.log('Not a valid JWT token either');
    }
    
    // If we get here, the token is invalid
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Middleware specifically for Supabase tokens only
 */
export const authenticateSupabase = async (req: Request, res: Response, next: NextFunction) => {
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
        error: 'Invalid Supabase token'
      });
    }
    
    const prismaUser = await getPrismaUserBySupabaseId(user.id);
    
    if (!prismaUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }
    
    req.userId = prismaUser.id;
    req.userEmail = prismaUser.email;
    req.supabaseUser = user;
    next();
    
  } catch (error) {
    console.error('Supabase authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
