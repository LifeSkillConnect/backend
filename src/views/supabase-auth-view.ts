import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { db } from '../services/supabase-database.service';
import { sendEmail } from "../utils/email.utils";
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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (exchangeError || !data.session || !data.user) {
      console.error('Error exchanging code for session:', exchangeError);
      return res.redirect(
        `${MOBILE_APP_SCHEME}?success=false&error=session_exchange_failed`
      );
    }

    const email = data.user.email!;
    const fullname = data.user.user_metadata?.full_name || 
                    data.user.user_metadata?.name || 
                    `${data.user.user_metadata?.given_name || ''} ${data.user.user_metadata?.family_name || ''}`.trim() ||
                    'User';
    const profilePicture = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;
    const authProvider = (data.user.app_metadata?.provider || 'GOOGLE').toUpperCase() as 'GOOGLE' | 'APPLE' | 'EMAIL';

    let user = await db.user.findUnique({ email });
    let createdNow = false;

    if (!user) {
      user = await db.user.create({
        email,
        fullname,
        profile_picture: profilePicture || undefined,
        auth_provider: authProvider,
        is_active: true,
        role: 'USER',
      });
      createdNow = true;
    } else {
      user = await db.user.update(user.id, {
        fullname,
        profile_picture: profilePicture || undefined,
        auth_provider: authProvider,
        is_active: true,
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        supabaseUserId: data.user.id,
        provider: 'google'
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    const isNewUser = !user.username || !user.phone_number;

    // Send welcome email only on first-time account creation via Google
    if (createdNow) {
      try {
        await sendEmail(
          email,
          "🎉 Welcome to LifeSkill Connect!",
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎉 Welcome to LifeSkill Connect!</h2>
                <p style="color: #666; font-size: 16px; text-align: center; margin-bottom: 20px;">Thanks for signing up with Google. Your account is ready.</p>
                <div style="background-color: #f0f8ff; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #4a90e2;">
                  <h3 style="color: #4a90e2; margin-top: 0;">What's Next?</h3>
                  <ul style="color: #666; line-height: 1.6;">
                    <li>📱 Complete your profile setup</li>
                    <li>🎯 Explore our skill-building modules</li>
                    <li>🏆 Track your progress and achievements</li>
                    <li>👥 Connect with our community</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started</a>
                </div>
              </div>
            </div>
          `
        );
      } catch (welcomeEmailError) {
        console.error("❌ Failed to send Google welcome email:", welcomeEmailError);
      }
    }

    if (isNewUser) {
      return res.redirect(`${process.env.GOOGLE_REDIRECT_URI}/verify-2/${token}`);
    } else {
      return res.redirect(`${process.env.GOOGLE_REDIRECT_URI}/verify/${token}`);
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

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullname: dbUser.fullname,
        username: dbUser.username,
        phone_number: dbUser.phone_number,
        auth_provider: dbUser.auth_provider,
        role: dbUser.role,
        is_active: dbUser.is_active,
        date_of_birth: dbUser.date_of_birth,
        profile_picture: dbUser.profile_picture,
        howdidyouhearaboutus: dbUser.howdidyouhearaboutus,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
      }
    });
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return res.status(500).json({ success: false, error: 'Failed to sign out' });
    }
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error in sign out:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No valid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const dbUser = await db.user.findUnique({ email: user.email! });
    if (!dbUser) {
      return res.status(404).json({ success: false, error: 'User not found in database' });
    }

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullname: dbUser.fullname,
        username: dbUser.username,
        phone_number: dbUser.phone_number,
        auth_provider: dbUser.auth_provider,
        role: dbUser.role,
        is_active: dbUser.is_active,
        date_of_birth: dbUser.date_of_birth,
        profile_picture: dbUser.profile_picture,
        howdidyouhearaboutus: dbUser.howdidyouhearaboutus,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
