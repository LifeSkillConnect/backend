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
  description: string;
  instructor_name: string;
  instructor_image: string;
  module_cover_image: string;
  plan_type: 'free' | 'premium';
  is_certification_on_completion: boolean;
  total_hours: number;
  subtitle_available: boolean;
  total_ratings: number;
  total_students: number;
  screentime_duration: number; // in minutes
  downloadable_resources_count: number;
  allocated_points: number;
  features: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface DatabaseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number; // in minutes
  order_index: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserModule {
  id: string;
  user_id: string;
  module_id: string;
  progress_percentage: number;
  current_lesson_id?: string;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseReview {
  id: string;
  user_id: string;
  module_id: string;
  rating: number; // 1-5 stars
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseReward {
  id: string;
  user_id: string;
  points: number;
  source: 'module_completion' | 'lesson_completion' | 'review' | 'streak' | 'achievement';
  source_id?: string; // module_id, lesson_id, etc.
  description: string;
  created_at: string;
}

export interface DatabaseAchievement {
  id: string;
  user_id: string;
  achievement_type: 'points_milestone' | 'streak_milestone' | 'module_milestone' | 'review_milestone';
  title: string;
  description: string;
  badge_icon: string;
  unlocked_at: string;
}

export interface DatabaseSubscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'achievement' | 'reminder' | 'reward' | 'system';
  is_read: boolean;
  created_at: string;
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
  description: string;
  instructor_name: string;
  instructor_image: string;
  module_cover_image: string;
  plan_type: 'free' | 'premium';
  is_certification_on_completion?: boolean;
  total_hours: number;
  subtitle_available?: boolean;
  total_ratings?: number;
  total_students?: number;
  screentime_duration: number;
  downloadable_resources_count?: number;
  allocated_points: number;
  features: string[];
  user_id?: string;
}

export interface CreateLessonData {
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order_index: number;
  is_preview?: boolean;
}

export interface CreateUserModuleData {
  user_id: string;
  module_id: string;
  progress_percentage?: number;
  current_lesson_id?: string;
  is_completed?: boolean;
}

export interface CreateReviewData {
  user_id: string;
  module_id: string;
  rating: number;
  comment: string;
}

export interface CreateRewardData {
  user_id: string;
  points: number;
  source: 'module_completion' | 'lesson_completion' | 'review' | 'streak' | 'achievement';
  source_id?: string;
  description: string;
}

export interface CreateAchievementData {
  user_id: string;
  achievement_type: 'points_milestone' | 'streak_milestone' | 'module_milestone' | 'review_milestone';
  title: string;
  description: string;
  badge_icon: string;
}

export interface CreateSubscriptionData {
  user_id: string;
  plan_type: 'free' | 'premium';
  status?: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'achievement' | 'reminder' | 'reward' | 'system';
  is_read?: boolean;
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

/**
 * Lesson Database Operations
 */
export class LessonService {
  static async findMany(options?: {
    where?: Partial<DatabaseLesson>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    take?: number;
    skip?: number;
  }): Promise<DatabaseLesson[]> {
    let query = supabase.from('lessons').select('*');

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

    return data as DatabaseLesson[];
  }

  static async findByModule(moduleId: string): Promise<DatabaseLesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseLesson[];
  }

  static async create(data: CreateLessonData): Promise<DatabaseLesson> {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return lesson as DatabaseLesson;
  }
}

/**
 * User Module Progress Database Operations
 */
export class UserModuleService {
  static async findByUser(userId: string): Promise<DatabaseUserModule[]> {
    const { data, error } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUserModule[];
  }

  static async findOngoing(userId: string): Promise<DatabaseUserModule[]> {
    const { data, error } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('started_at', { ascending: false })
      .limit(3);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUserModule[];
  }

  static async findCompleted(userId: string): Promise<DatabaseUserModule[]> {
    const { data, error } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseUserModule[];
  }

  static async create(data: CreateUserModuleData): Promise<DatabaseUserModule> {
    const { data: userModule, error } = await supabase
      .from('user_modules')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return userModule as DatabaseUserModule;
  }

  static async updateProgress(userId: string, moduleId: string, progress: number): Promise<DatabaseUserModule> {
    const { data: userModule, error } = await supabase
      .from('user_modules')
      .update({ progress_percentage: progress })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return userModule as DatabaseUserModule;
  }
}

/**
 * Review Database Operations
 */
export class ReviewService {
  static async findByModule(moduleId: string): Promise<DatabaseReview[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseReview[];
  }

  static async create(data: CreateReviewData): Promise<DatabaseReview> {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return review as DatabaseReview;
  }
}

/**
 * Reward Database Operations
 */
export class RewardService {
  static async findByUser(userId: string): Promise<DatabaseReward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseReward[];
  }

  static async getTotalPoints(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('rewards')
      .select('points')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data.reduce((total, reward) => total + reward.points, 0);
  }

  static async create(data: CreateRewardData): Promise<DatabaseReward> {
    const { data: reward, error } = await supabase
      .from('rewards')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return reward as DatabaseReward;
  }
}

/**
 * Achievement Database Operations
 */
export class AchievementService {
  static async findByUser(userId: string): Promise<DatabaseAchievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseAchievement[];
  }

  static async create(data: CreateAchievementData): Promise<DatabaseAchievement> {
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return achievement as DatabaseAchievement;
  }
}

/**
 * Subscription Database Operations
 */
export class SubscriptionService {
  static async findByUser(userId: string): Promise<DatabaseSubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseSubscription;
  }

  static async create(data: CreateSubscriptionData): Promise<DatabaseSubscription> {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return subscription as DatabaseSubscription;
  }

  static async update(userId: string, data: Partial<DatabaseSubscription>): Promise<DatabaseSubscription> {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(data)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return subscription as DatabaseSubscription;
  }
}

/**
 * Notification Database Operations
 */
export class NotificationService {
  static async findByUser(userId: string): Promise<DatabaseNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as DatabaseNotification[];
  }

  static async create(data: CreateNotificationData): Promise<DatabaseNotification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return notification as DatabaseNotification;
  }

  static async markAsRead(notificationId: string): Promise<DatabaseNotification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return notification as DatabaseNotification;
  }
}

// Export a default database object for easy migration
export const db = {
  user: UserService,
  otp: OtpService,
  module: ModuleService,
  lesson: LessonService,
  userModule: UserModuleService,
  review: ReviewService,
  reward: RewardService,
  achievement: AchievementService,
  subscription: SubscriptionService,
  notification: NotificationService,
  auth: AuthService
};

export default db;
