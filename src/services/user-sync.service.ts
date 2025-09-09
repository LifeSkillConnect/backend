import { User } from '@supabase/supabase-js';
import { prisma } from '../views/authentication-view';
import { supabaseAdmin } from '../config/supabase';

export interface SyncUserData {
  id: string;
  email: string;
  fullname: string;
  profilePicture?: string;
  authProvider: 'GOOGLE' | 'APPLE' | 'EMAIL';
  phoneNumber?: string;
  username?: string;
  dateOfBirth?: Date;
  howdidyouhearaboutus?: string;
}

/**
 * Syncs a Supabase Auth user with your Prisma database
 * Creates a new user if they don't exist, updates if they do
 */
export const syncSupabaseUserToPrisma = async (supabaseUser: User): Promise<SyncUserData> => {
  try {
    // Extract user data from Supabase Auth user
    const email = supabaseUser.email!;
    const fullname = supabaseUser.user_metadata?.full_name || 
                    supabaseUser.user_metadata?.name || 
                    `${supabaseUser.user_metadata?.given_name || ''} ${supabaseUser.user_metadata?.family_name || ''}`.trim() ||
                    'User';
    
    const profilePicture = supabaseUser.user_metadata?.avatar_url || 
                          supabaseUser.user_metadata?.picture || 
                          null;
    
    // Determine auth provider based on Supabase app_metadata
    const authProvider = supabaseUser.app_metadata?.provider || 'EMAIL';
    
    // Check if user exists in Prisma
    let existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update existing user with latest data from Supabase
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullname,
          profilePicture,
          authProvider: authProvider.toUpperCase() as 'GOOGLE' | 'APPLE' | 'EMAIL',
          isActive: true,
        }
      });
      
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        profilePicture: updatedUser.profilePicture || undefined,
        authProvider: updatedUser.authProvider as 'GOOGLE' | 'APPLE' | 'EMAIL',
        phoneNumber: updatedUser.phoneNumber || undefined,
        username: updatedUser.username || undefined,
        dateOfBirth: updatedUser.dateOfBirth || undefined,
        howdidyouhearaboutus: updatedUser.howdidyouhearaboutus || undefined,
      };
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          fullname,
          profilePicture,
          authProvider: authProvider.toUpperCase() as 'GOOGLE' | 'APPLE' | 'EMAIL',
          isActive: true,
          role: 'USER',
        }
      });
      
      return {
        id: newUser.id,
        email: newUser.email,
        fullname: newUser.fullname,
        profilePicture: newUser.profilePicture || undefined,
        authProvider: newUser.authProvider as 'GOOGLE' | 'APPLE' | 'EMAIL',
        phoneNumber: newUser.phoneNumber || undefined,
        username: newUser.username || undefined,
        dateOfBirth: newUser.dateOfBirth || undefined,
        howdidyouhearaboutus: newUser.howdidyouhearaboutus || undefined,
      };
    }
  } catch (error) {
    console.error('Error syncing Supabase user to Prisma:', error);
    throw new Error('Failed to sync user data');
  }
};

/**
 * Gets a Prisma user by Supabase user ID
 */
export const getPrismaUserBySupabaseId = async (supabaseUserId: string): Promise<SyncUserData | null> => {
  try {
    // First, get the Supabase user to get their email
    const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
    
    if (error || !supabaseUser.user) {
      console.error('Error fetching Supabase user:', error);
      return null;
    }
    
    // Then find the corresponding Prisma user
    const prismaUser = await prisma.user.findUnique({
      where: { email: supabaseUser.user.email! }
    });
    
    if (!prismaUser) {
      return null;
    }
    
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      fullname: prismaUser.fullname,
      profilePicture: prismaUser.profilePicture || undefined,
      authProvider: prismaUser.authProvider as 'GOOGLE' | 'APPLE' | 'EMAIL',
      phoneNumber: prismaUser.phoneNumber || undefined,
      username: prismaUser.username || undefined,
      dateOfBirth: prismaUser.dateOfBirth || undefined,
      howdidyouhearaboutus: prismaUser.howdidyouhearaboutus || undefined,
    };
  } catch (error) {
    console.error('Error getting Prisma user by Supabase ID:', error);
    return null;
  }
};
