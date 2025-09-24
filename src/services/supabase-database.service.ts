import { supabase, supabaseAdmin } from '../config/supabase';
import { User } from '@supabase/supabase-js';

// Types matching your Prisma schema
export interface DatabaseUser {
  id: string;
  email: string;
  fullname: string;
  username?: string;
  phone_number?: string;
  password?: string;
  auth_provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  date_of_birth?: string;
  profile_picture?: string;
  howdidyouhearaboutus?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOtp {
  id: string;
  email: string;
  otp: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseModule {
  id: string;
  title: string;
  plan_type: 'free' | 'premium';
  is_certification_on_completion: boolean;
  total_hours: number;
  subtitle_available: boolean;
  description?: string;
  features: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface CreateUserData {
  email: string;
  fullname: string;
  username?: string;
  phone_number?: string;
  password?: string;
  auth_provider?: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  role?: 'USER' | 'ADMIN';
  is_active?: boolean;
  date_of_birth?: string;
  profile_picture?: string;
  howdidyouhearaboutus?: string;
}

export interface UpdateUserData {
  fullname?: string;
  username?: string;
  phone_number?: string;
  password?: string;
  auth_provider?: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  role?: 'USER' | 'ADMIN';
  is_active?: boolean;
  date_of_birth?: string;
  profile_picture?: string;
  howdidyouhearaboutus?: string;
}

export interface CreateOtpData {
  email: string;
  otp: string;
  is_used?: boolean;
  expires_at?: string;
}

export interface CreateModuleData {
  title: string;
  plan_type: 'free' | 'premium';
  is_certification_on_completion?: boolean;
  total_hours: number;
  subtitle_available?: boolean;
  description?: string;
  features: string[];
  user_id?: string;
}

/**
 * User Database Operations
 */
export class UserService {
  static async findUnique(where: { email: string }): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', where.email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUser;
  }

  static async findById(id: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUser;
  }

  static async create(data: CreateUserData): Promise<DatabaseUser> {
    const { data: user, error } = await supabase
      .from('users')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return user as DatabaseUser;
  }

  static async update(id: string, data: UpdateUserData): Promise<DatabaseUser> {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return user as DatabaseUser;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findMany(options?: {
    where?: Partial<DatabaseUser>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    take?: number;
    skip?: number;
  }): Promise<DatabaseUser[]> {
    let query = supabase.from('users').select('*');

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    if (options?.orderBy) {
      Object.entries(options.orderBy).forEach(([key, value]) => {
        query = query.order(key, { ascending: value === 'asc' });
      });
    }

    if (options?.take) {
      query = query.limit(options.take);
    }

    if (options?.skip) {
      query = query.range(options.skip, options.skip + (options.take || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUser[];
  }
}

/**
 * OTP Database Operations
 */
export class OtpService {
  static async findFirst(options: {
    where: {
      email: string;
      otp: string;
      is_used: boolean;
    };
    orderBy: {
      created_at: 'desc';
    };
  }): Promise<DatabaseOtp | null> {
    const { data, error } = await supabase
      .from('otp')
      .select('*')
      .eq('email', options.where.email)
      .eq('otp', options.where.otp)
      .eq('is_used', options.where.is_used)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseOtp;
  }

  static async create(data: CreateOtpData): Promise<DatabaseOtp> {
    const { data: otp, error } = await supabase
      .from('otp')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return otp as DatabaseOtp;
  }

  static async update(id: string, data: Partial<DatabaseOtp>): Promise<DatabaseOtp> {
    const { data: otp, error } = await supabase
      .from('otp')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return otp as DatabaseOtp;
  }

  static async deleteExpired(): Promise<void> {
    const { error } = await supabase
      .from('otp')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

/**
 * Module Database Operations
 */
export class ModuleService {
  static async findMany(options?: {
    where?: Partial<DatabaseModule>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    take?: number;
    skip?: number;
  }): Promise<DatabaseModule[]> {
    let query = supabase.from('modules').select('*');

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    if (options?.orderBy) {
      Object.entries(options.orderBy).forEach(([key, value]) => {
        query = query.order(key, { ascending: value === 'asc' });
      });
    }

    if (options?.take) {
      query = query.limit(options.take);
    }

    if (options?.skip) {
      query = query.range(options.skip, options.skip + (options.take || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseModule[];
  }

  static async findById(id: string): Promise<DatabaseModule | null> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseModule;
  }

  static async create(data: CreateModuleData): Promise<DatabaseModule> {
    const { data: module, error } = await supabase
      .from('modules')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return module as DatabaseModule;
  }

  static async update(id: string, data: Partial<DatabaseModule>): Promise<DatabaseModule> {
    const { data: module, error } = await supabase
      .from('modules')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return module as DatabaseModule;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async assignToUser(moduleIds: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from('modules')
      .update({ user_id: userId })
      .in('id', moduleIds);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

/**
 * Authentication Service using Supabase Auth
 */
export class AuthService {
  static async signUp(email: string, password: string, metadata?: any): Promise<{ user: User | null; error: any }> {
    // Use Admin API to create user as confirmed and avoid Supabase confirmation emails
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata || {}
    });

    return { user: data?.user ?? null, error };
  }

  static async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { user: data.user, error };
  }

  static async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async getUser(token: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    return { user: data.user, error };
  }

  static async resetPassword(email: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }

  static async updateUser(userId: string, attributes: any): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, attributes);
    return { user: data.user, error };
  }
}

// Export a default database object for easy migration
export const db = {
  user: UserService,
  otp: OtpService,
  module: ModuleService,
  auth: AuthService
};

export default db;
