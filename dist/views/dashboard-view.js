"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSettings = exports.markNotificationAsRead = exports.getNotifications = exports.updateUserSettings = exports.getUserSettings = exports.updateUserProfile = exports.getUserProfile = exports.getDashboardSummary = void 0;
const yup = __importStar(require("yup"));
const supabase_database_service_1 = require("../services/supabase-database.service");
// Validation schemas
const updateProfileSchema = yup.object({
    fullname: yup.string().min(2).max(50).optional(),
    username: yup.string().min(3).max(20).optional(),
    phone_number: yup.string().optional(),
    profile_picture: yup.string().url().optional(),
});
const notificationSettingsSchema = yup.object({
    email_notifications: yup.boolean().optional(),
    push_notifications: yup.boolean().optional(),
    achievement_notifications: yup.boolean().optional(),
    module_reminders: yup.boolean().optional(),
});
// Get Dashboard Summary (All dashboard data in one call)
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.auth.userId;
        // Get user info
        const user = await supabase_database_service_1.db.user.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        // Get subscription status
        const subscription = await supabase_database_service_1.db.subscription.findByUser(userId);
        const isPremium = subscription && subscription.plan_type === 'premium' && subscription.status === 'active';
        // Get ongoing modules (3)
        const ongoingModules = await supabase_database_service_1.db.userModule.findOngoing(userId);
        const ongoingModulesWithDetails = await Promise.all(ongoingModules.map(async (userModule) => {
            const module = await supabase_database_service_1.db.module.findMany({
                where: { id: userModule.module_id },
                take: 1
            });
            if (module.length === 0)
                return null;
            return {
                id: module[0].id,
                title: module[0].title,
                description: module[0].description,
                instructor_name: module[0].instructor_name,
                instructor_image: module[0].instructor_image,
                module_cover_image: module[0].module_cover_image,
                progress_percentage: userModule.progress_percentage,
                current_lesson_id: userModule.current_lesson_id,
                started_at: userModule.started_at,
                screentime_duration: module[0].screentime_duration
            };
        }));
        // Get completed modules (3)
        const completedModules = await supabase_database_service_1.db.userModule.findCompleted(userId);
        const completedModulesWithDetails = await Promise.all(completedModules.map(async (userModule) => {
            const module = await supabase_database_service_1.db.module.findMany({
                where: { id: userModule.module_id },
                take: 1
            });
            if (module.length === 0)
                return null;
            return {
                id: module[0].id,
                title: module[0].title,
                description: module[0].description,
                instructor_name: module[0].instructor_name,
                instructor_image: module[0].instructor_image,
                module_cover_image: module[0].module_cover_image,
                progress_percentage: userModule.progress_percentage,
                completed_at: userModule.completed_at,
                screentime_duration: module[0].screentime_duration
            };
        }));
        // Get total reward points
        const totalPoints = await supabase_database_service_1.db.reward.getTotalPoints(userId);
        // Get recent achievements
        const achievements = await supabase_database_service_1.db.achievement.findByUser(userId);
        const recentAchievements = achievements.slice(0, 3);
        // Get unread notifications count
        const notifications = await supabase_database_service_1.db.notification.findByUser(userId);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        return res.status(200).json({
            success: true,
            dashboard: {
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    username: user.username,
                    profile_picture: user.profile_picture,
                    email: user.email
                },
                subscription: {
                    is_premium: isPremium,
                    plan_type: isPremium ? 'premium' : 'free',
                    status: (subscription === null || subscription === void 0 ? void 0 : subscription.status) || 'active'
                },
                ongoing_modules: ongoingModulesWithDetails.filter(m => m !== null),
                completed_modules: completedModulesWithDetails.filter(m => m !== null),
                rewards: {
                    total_points: totalPoints,
                    recent_achievements: recentAchievements.map(achievement => ({
                        title: achievement.title,
                        description: achievement.description,
                        badge_icon: achievement.badge_icon,
                        unlocked_at: achievement.unlocked_at
                    }))
                },
                notifications: {
                    unread_count: unreadCount,
                    recent_notifications: notifications.slice(0, 3).map(notification => ({
                        id: notification.id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        is_read: notification.is_read,
                        created_at: notification.created_at
                    }))
                }
            }
        });
    }
    catch (error) {
        console.error("Error in getDashboardSummary:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
// Get User Profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await supabase_database_service_1.db.user.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            profile: {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                username: user.username,
                phone_number: user.phone_number,
                profile_picture: user.profile_picture,
                date_of_birth: user.date_of_birth,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
    }
    catch (error) {
        console.error("Error in getUserProfile:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getUserProfile = getUserProfile;
// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        await updateProfileSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        const updateData = req.body;
        const updatedUser = await supabase_database_service_1.db.user.update(userId, updateData);
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                username: updatedUser.username,
                phone_number: updatedUser.phone_number,
                profile_picture: updatedUser.profile_picture,
                updated_at: updatedUser.updated_at
            }
        });
    }
    catch (error) {
        console.error("Error in updateUserProfile:", error);
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.updateUserProfile = updateUserProfile;
// Get User Settings (placeholder)
const getUserSettings = async (req, res) => {
    try {
        const userId = req.auth.userId;
        // This would typically come from a user_settings table
        // For now, return default settings
        return res.status(200).json({
            success: true,
            settings: {
                email_notifications: true,
                push_notifications: true,
                achievement_notifications: true,
                module_reminders: true,
                theme: 'light',
                language: 'en'
            }
        });
    }
    catch (error) {
        console.error("Error in getUserSettings:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getUserSettings = getUserSettings;
// Update User Settings (placeholder)
const updateUserSettings = async (req, res) => {
    try {
        await notificationSettingsSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        // This would typically update a user_settings table
        // For now, just return success
        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            settings: req.body
        });
    }
    catch (error) {
        console.error("Error in updateUserSettings:", error);
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.updateUserSettings = updateUserSettings;
// Get Notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { limit = 20, offset = 0 } = req.query;
        const notifications = await supabase_database_service_1.db.notification.findByUser(userId);
        // Apply pagination
        const paginatedNotifications = notifications.slice(Number(offset), Number(offset) + Number(limit));
        return res.status(200).json({
            success: true,
            notifications: paginatedNotifications.map(notification => ({
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                is_read: notification.is_read,
                created_at: notification.created_at
            })),
            pagination: {
                total: notifications.length,
                limit: Number(limit),
                offset: Number(offset),
                has_more: Number(offset) + Number(limit) < notifications.length,
                unread_count: notifications.filter(n => !n.is_read).length
            }
        });
    }
    catch (error) {
        console.error("Error in getNotifications:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getNotifications = getNotifications;
// Mark Notification as Read
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await supabase_database_service_1.db.notification.markAsRead(id);
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                is_read: notification.is_read,
                created_at: notification.created_at
            }
        });
    }
    catch (error) {
        console.error("Error in markNotificationAsRead:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Update Notification Settings (placeholder)
const updateNotificationSettings = async (req, res) => {
    try {
        await notificationSettingsSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        // This would typically update notification preferences in a settings table
        return res.status(200).json({
            success: true,
            message: "Notification settings updated successfully",
            settings: req.body
        });
    }
    catch (error) {
        console.error("Error in updateNotificationSettings:", error);
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.updateNotificationSettings = updateNotificationSettings;
