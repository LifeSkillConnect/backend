import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { syncSupabaseUserToPrisma, getPrismaUserBySupabaseId } from '../services/user-sync.service';
import jwt from 'jsonwebtoken';

const MOBILE_APP_SCHEME = process.env.MOBILE_APP_SCHEME || "lifeskillsconnect://";

/**
 * Start Google OAuth flow using Supabase
 * This redirects to Supabase's hosted OAuth page
 */
export const startGoogleAuth = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.SUPABASE_REDIRECT_URL || process.env.GOOGLE_REDIRECT_URI}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to initiate Google OAuth'
      });
    }

    if (data.url) {
      res.redirect(data.url);
    } else {
      res.status(500).json({
        success: false,
        error: 'No OAuth URL generated'
      });
    }
  } catch (error) {
    console.error('Error starting Google OAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Handle Google OAuth callback from Supabase
 * This is called after the user completes OAuth on Supabase
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(
        `${MOBILE_APP_SCHEME}?success=false&error=${encodeURIComponent(error as string)}`
      );
    }

    if (!code) {
      console.error('No authorization code provided');
      return res.redirect(
        `${MOBILE_APP_SCHEME}?success=false&error=no_code`
      );
    }

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (exchangeError || !data.session || !data.user) {
      console.error('Error exchanging code for session:', exchangeError);
      return res.redirect(
        `${MOBILE_APP_SCHEME}?success=false&error=session_exchange_failed`
      );
    }

    // Sync user to Prisma database
    const syncedUser = await syncSupabaseUserToPrisma(data.user);

    // Generate your own JWT token for your app
    const token = jwt.sign(
      { 
        userId: syncedUser.id, 
        email: syncedUser.email,
        supabaseUserId: data.user.id,
        provider: 'google'
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log('Generated token for user:', { userId: syncedUser.id, email: syncedUser.email });

    // Check if this is a new user (no additional profile data)
    const isNewUser = !syncedUser.username || !syncedUser.phoneNumber;

    if (isNewUser) {
      return res.redirect(
        `${process.env.GOOGLE_REDIRECT_URI}/verify-2/${token}`
      );
    } else {
      return res.redirect(
        `${process.env.GOOGLE_REDIRECT_URI}/verify/${token}`
      );
    }
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return res.redirect(
      `${MOBILE_APP_SCHEME}?success=false&error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`
    );
  }
};

/**
 * Verify Supabase JWT token and return user data
 * This can be used to verify tokens from your mobile app
 */
export const verifySupabaseToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get user data from Prisma
    const prismaUser = await getPrismaUserBySupabaseId(user.id);

    if (!prismaUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }

    res.json({
      success: true,
      user: prismaUser
    });
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Sign out user from Supabase
 */
export const signOut = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sign out'
      });
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Error in sign out:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (req: Request, res: Response) => {
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

    const prismaUser = await getPrismaUserBySupabaseId(user.id);

    if (!prismaUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }

    res.json({
      success: true,
      user: prismaUser
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
