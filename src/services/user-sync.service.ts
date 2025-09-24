import { User } from '@supabase/supabase-js';
import { db } from '../services/supabase-database.service';

export interface SyncUserData {
  id: string;
  email: string;
  fullname: string;
  profilePicture?: string;
  authProvider: 'GOOGLE' | 'APPLE' | 'EMAIL';
  phoneNumber?: string;
  username?: string;
  dateOfBirth?: Date | string;
  howdidyouhearaboutus?: string;
}

export const syncSupabaseUser = async (supabaseUser: User): Promise<SyncUserData> => {
  const email = supabaseUser.email!;
  const fullname = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || `${supabaseUser.user_metadata?.given_name || ''} ${supabaseUser.user_metadata?.family_name || ''}`.trim() || 'User';
  const profilePicture = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || undefined;
  const authProvider = (supabaseUser.app_metadata?.provider || 'EMAIL').toUpperCase() as 'GOOGLE' | 'APPLE' | 'EMAIL';

  let user = await db.user.findUnique({ email });
  if (user) {
    const updated = await db.user.update(user.id, {
      fullname,
      profile_picture: profilePicture,
      auth_provider: authProvider,
      is_active: true,
    });
    return {
      id: updated.id,
      email: updated.email,
      fullname: updated.fullname,
      profilePicture: updated.profile_picture,
      authProvider,
      phoneNumber: updated.phone_number,
      username: updated.username,
      dateOfBirth: updated.date_of_birth,
      howdidyouhearaboutus: updated.howdidyouhearaboutus,
    };
  }

  const created = await db.user.create({
    email,
    fullname,
    profile_picture: profilePicture,
    auth_provider: authProvider,
    is_active: true,
    role: 'USER',
  });

  return {
    id: created.id,
    email: created.email,
    fullname: created.fullname,
    profilePicture: created.profile_picture,
    authProvider,
    phoneNumber: created.phone_number,
    username: created.username,
    dateOfBirth: created.date_of_birth,
    howdidyouhearaboutus: created.howdidyouhearaboutus,
  };
};
