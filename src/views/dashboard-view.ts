import { Request, Response } from "express";
import * as yup from "yup";
import { 
  db, 
  DatabaseUser,
  DatabaseUserModule,
  DatabaseReward,
  DatabaseAchievement,
  DatabaseNotification,
  DatabaseSubscription,
  UpdateUserData
} from "../services/supabase-database.service";

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
export const getDashboardSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId;
    
    // Get user info
    const user = await db.user.findUnique({ email: (req as any).userEmail });
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
  } catch (error) {
    console.error("Error in getDashboardSummary:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get User Profile
export const getUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await db.user.findUnique({ email: (req as any).userEmail });
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
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    await updateProfileSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).userId;
    const updateData: UpdateUserData = req.body;

    const updatedUser = await db.user.update(userId, updateData);

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
  } catch (error) {
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

// Get User Settings (placeholder)
export const getUserSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId;
    
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
  } catch (error) {
    console.error("Error in getUserSettings:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Update User Settings (placeholder)
export const updateUserSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    await notificationSettingsSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).userId;
    
    // This would typically update a user_settings table
    // For now, just return success
    
    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: req.body
    });
  } catch (error) {
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

// Get Notifications
export const getNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Mark Notification as Read
export const markNotificationAsRead = async (req: Request, res: Response): Promise<Response> => {
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
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Update Notification Settings (placeholder)
export const updateNotificationSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    await notificationSettingsSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).userId;
    
    // This would typically update notification preferences in a settings table
    
    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings: req.body
    });
  } catch (error) {
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
