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
        const userId = req.userId;
        // Get user info
        const user = await supabase_database_service_1.db.user.findUnique({ email: req.userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        // For now, return a simplified dashboard since the new tables don't exist yet
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
                    is_premium: false,
                    plan_type: 'free',
                    status: 'active'
                },
                ongoing_modules: [],
                completed_modules: [],
                rewards: {
                    total_points: 0,
                    recent_achievements: []
                },
                notifications: {
                    unread_count: 0,
                    recent_notifications: []
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
        const user = await supabase_database_service_1.db.user.findUnique({ email: req.userEmail });
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
        const userId = req.userId;
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
        const userId = req.userId;
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
        const userId = req.userId;
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
        const userId = req.userId;
        const { limit = 20, offset = 0 } = req.query;
        // For now, return empty notifications since the table doesn't exist yet
        return res.status(200).json({
            success: true,
            notifications: [],
            pagination: {
                total: 0,
                limit: Number(limit),
                offset: Number(offset),
                has_more: false,
                unread_count: 0
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
        // For now, return success since the table doesn't exist yet
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: {
                id: id,
                title: "Sample notification",
                message: "This is a placeholder notification",
                type: "info",
                is_read: true,
                created_at: new Date().toISOString()
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
        const userId = req.userId;
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
