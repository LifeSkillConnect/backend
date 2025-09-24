"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.NotificationService = exports.SubscriptionService = exports.AchievementService = exports.RewardService = exports.ReviewService = exports.UserModuleService = exports.LessonService = exports.AuthService = exports.ModuleService = exports.OtpService = exports.UserService = void 0;
const supabase_1 = require("../config/supabase");
/**
 * User Database Operations
 */
class UserService {
    static async findUnique(where) {
        const { data, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('email', where.email)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return user;
    }
    static async update(id, data) {
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return user;
    }
    static async delete(id) {
        const { error } = await supabase_1.supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
    static async findMany(options) {
        let query = supabase_1.supabase.from('users').select('*');
        if (options === null || options === void 0 ? void 0 : options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                if (value !== undefined) {
                    query = query.eq(key, value);
                }
            });
        }
        if (options === null || options === void 0 ? void 0 : options.orderBy) {
            Object.entries(options.orderBy).forEach(([key, value]) => {
                query = query.order(key, { ascending: value === 'asc' });
            });
        }
        if (options === null || options === void 0 ? void 0 : options.take) {
            query = query.limit(options.take);
        }
        if (options === null || options === void 0 ? void 0 : options.skip) {
            query = query.range(options.skip, options.skip + (options.take || 10) - 1);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
}
exports.UserService = UserService;
/**
 * OTP Database Operations
 */
class OtpService {
    static async findFirst(options) {
        const { data, error } = await supabase_1.supabase
            .from('otp')
            .select('*')
            .eq('email', options.where.email)
            .eq('otp', options.where.otp)
            .eq('is_used', options.where.is_used)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: otp, error } = await supabase_1.supabase
            .from('otp')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return otp;
    }
    static async update(id, data) {
        const { data: otp, error } = await supabase_1.supabase
            .from('otp')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return otp;
    }
    static async deleteExpired() {
        const { error } = await supabase_1.supabase
            .from('otp')
            .delete()
            .lt('expires_at', new Date().toISOString());
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
}
exports.OtpService = OtpService;
/**
 * Module Database Operations
 */
class ModuleService {
    static async findMany(options) {
        let query = supabase_1.supabase.from('modules').select('*');
        if (options === null || options === void 0 ? void 0 : options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                if (value !== undefined) {
                    query = query.eq(key, value);
                }
            });
        }
        if (options === null || options === void 0 ? void 0 : options.orderBy) {
            Object.entries(options.orderBy).forEach(([key, value]) => {
                query = query.order(key, { ascending: value === 'asc' });
            });
        }
        if (options === null || options === void 0 ? void 0 : options.take) {
            query = query.limit(options.take);
        }
        if (options === null || options === void 0 ? void 0 : options.skip) {
            query = query.range(options.skip, options.skip + (options.take || 10) - 1);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('modules')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: module, error } = await supabase_1.supabase
            .from('modules')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return module;
    }
    static async update(id, data) {
        const { data: module, error } = await supabase_1.supabase
            .from('modules')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return module;
    }
    static async delete(id) {
        const { error } = await supabase_1.supabase
            .from('modules')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
    static async assignToUser(moduleIds, userId) {
        const { error } = await supabase_1.supabase
            .from('modules')
            .update({ user_id: userId })
            .in('id', moduleIds);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
}
exports.ModuleService = ModuleService;
/**
 * Authentication Service using Supabase Auth
 */
class AuthService {
    static async signUp(email, password, metadata) {
        var _a;
        // Use Admin API to create user as confirmed and avoid Supabase confirmation emails
        const { data, error } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata || {}
        });
        return { user: (_a = data === null || data === void 0 ? void 0 : data.user) !== null && _a !== void 0 ? _a : null, error };
    }
    static async signIn(email, password) {
        const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
            email,
            password
        });
        return { user: data.user, error };
    }
    static async signOut() {
        const { error } = await supabase_1.supabase.auth.signOut();
        return { error };
    }
    static async getUser(token) {
        const { data, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        return { user: data.user, error };
    }
    static async resetPassword(email) {
        const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email);
        return { error };
    }
    static async updateUser(userId, attributes) {
        const { data, error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, attributes);
        return { user: data.user, error };
    }
}
exports.AuthService = AuthService;
/**
 * Lesson Database Operations
 */
class LessonService {
    static async findMany(options) {
        let query = supabase_1.supabase.from('lessons').select('*');
        if (options === null || options === void 0 ? void 0 : options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                if (value !== undefined) {
                    query = query.eq(key, value);
                }
            });
        }
        if (options === null || options === void 0 ? void 0 : options.orderBy) {
            Object.entries(options.orderBy).forEach(([key, value]) => {
                query = query.order(key, { ascending: value === 'asc' });
            });
        }
        if (options === null || options === void 0 ? void 0 : options.take) {
            query = query.limit(options.take);
        }
        if (options === null || options === void 0 ? void 0 : options.skip) {
            query = query.range(options.skip, options.skip + (options.take || 10) - 1);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async findByModule(moduleId) {
        const { data, error } = await supabase_1.supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true });
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: lesson, error } = await supabase_1.supabase
            .from('lessons')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return lesson;
    }
}
exports.LessonService = LessonService;
/**
 * User Module Progress Database Operations
 */
class UserModuleService {
    static async findByUser(userId) {
        const { data, error } = await supabase_1.supabase
            .from('user_modules')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async findOngoing(userId) {
        const { data, error } = await supabase_1.supabase
            .from('user_modules')
            .select('*')
            .eq('user_id', userId)
            .eq('is_completed', false)
            .order('started_at', { ascending: false })
            .limit(3);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async findCompleted(userId) {
        const { data, error } = await supabase_1.supabase
            .from('user_modules')
            .select('*')
            .eq('user_id', userId)
            .eq('is_completed', true)
            .order('completed_at', { ascending: false })
            .limit(3);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: userModule, error } = await supabase_1.supabase
            .from('user_modules')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return userModule;
    }
    static async updateProgress(userId, moduleId, progress) {
        const { data: userModule, error } = await supabase_1.supabase
            .from('user_modules')
            .update({ progress_percentage: progress })
            .eq('user_id', userId)
            .eq('module_id', moduleId)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return userModule;
    }
}
exports.UserModuleService = UserModuleService;
/**
 * Review Database Operations
 */
class ReviewService {
    static async findByModule(moduleId) {
        const { data, error } = await supabase_1.supabase
            .from('reviews')
            .select('*')
            .eq('module_id', moduleId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: review, error } = await supabase_1.supabase
            .from('reviews')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return review;
    }
}
exports.ReviewService = ReviewService;
/**
 * Reward Database Operations
 */
class RewardService {
    static async findByUser(userId) {
        const { data, error } = await supabase_1.supabase
            .from('rewards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async getTotalPoints(userId) {
        const { data, error } = await supabase_1.supabase
            .from('rewards')
            .select('points')
            .eq('user_id', userId);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data.reduce((total, reward) => total + reward.points, 0);
    }
    static async create(data) {
        const { data: reward, error } = await supabase_1.supabase
            .from('rewards')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return reward;
    }
}
exports.RewardService = RewardService;
/**
 * Achievement Database Operations
 */
class AchievementService {
    static async findByUser(userId) {
        const { data, error } = await supabase_1.supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: achievement, error } = await supabase_1.supabase
            .from('achievements')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return achievement;
    }
}
exports.AchievementService = AchievementService;
/**
 * Subscription Database Operations
 */
class SubscriptionService {
    static async findByUser(userId) {
        const { data, error } = await supabase_1.supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: subscription, error } = await supabase_1.supabase
            .from('subscriptions')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return subscription;
    }
    static async update(userId, data) {
        const { data: subscription, error } = await supabase_1.supabase
            .from('subscriptions')
            .update(data)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return subscription;
    }
}
exports.SubscriptionService = SubscriptionService;
/**
 * Notification Database Operations
 */
class NotificationService {
    static async findByUser(userId) {
        const { data, error } = await supabase_1.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return data;
    }
    static async create(data) {
        const { data: notification, error } = await supabase_1.supabase
            .from('notifications')
            .insert([data])
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return notification;
    }
    static async markAsRead(notificationId) {
        const { data: notification, error } = await supabase_1.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .select()
            .single();
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        return notification;
    }
}
exports.NotificationService = NotificationService;
// Export a default database object for easy migration
exports.db = {
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
exports.default = exports.db;
