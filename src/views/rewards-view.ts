import { Request, Response } from "express";
import * as yup from "yup";
import { 
  db, 
  DatabaseReward, 
  DatabaseAchievement
} from "../services/supabase-database.service";

// Validation schemas
const claimRewardSchema = yup.object({
  reward_type: yup.string().oneOf(['points', 'badge', 'certificate']).required(),
  amount: yup.number().min(1).optional(),
});

// Get Total Rewards (180 pts)
export const getTotalRewards = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const totalPoints = await db.reward.getTotalPoints(userId);
    const achievements = await db.achievement.findByUser(userId);

    return res.status(200).json({
      success: true,
      rewards: {
        total_points: totalPoints,
        achievements_count: achievements.length,
        badges_unlocked: achievements.filter(a => a.achievement_type === 'points_milestone').length,
        recent_achievements: achievements.slice(0, 3).map(achievement => ({
          title: achievement.title,
          description: achievement.description,
          badge_icon: achievement.badge_icon,
          unlocked_at: achievement.unlocked_at
        }))
      }
    });
  } catch (error) {
    console.error("Error in getTotalRewards:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Reward History
export const getRewardHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    const { limit = 20, offset = 0 } = req.query;
    
    const rewards = await db.reward.findByUser(userId);
    
    // Apply pagination
    const paginatedRewards = rewards.slice(
      Number(offset), 
      Number(offset) + Number(limit)
    );

    return res.status(200).json({
      success: true,
      rewards: paginatedRewards.map(reward => ({
        id: reward.id,
        points: reward.points,
        source: reward.source,
        description: reward.description,
        created_at: reward.created_at
      })),
      pagination: {
        total: rewards.length,
        limit: Number(limit),
        offset: Number(offset),
        has_more: Number(offset) + Number(limit) < rewards.length
      }
    });
  } catch (error) {
    console.error("Error in getRewardHistory:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Claim Reward (placeholder - implement based on your reward system)
export const claimReward = async (req: Request, res: Response): Promise<Response> => {
  try {
    await claimRewardSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).auth.userId;
    const { reward_type, amount } = req.body;

    // This is a placeholder implementation
    // You would implement actual reward claiming logic here
    // For example: redeem points for certificates, badges, etc.

    if (reward_type === 'points' && amount) {
      // Check if user has enough points
      const totalPoints = await db.reward.getTotalPoints(userId);
      
      if (totalPoints < amount) {
        return res.status(400).json({
          success: false,
          error: "Insufficient points to claim this reward"
        });
      }

      // Create a "claimed" reward entry (negative points to deduct)
      await db.reward.create({
        user_id: userId,
        points: -amount,
        source: 'achievement',
        description: `Claimed ${amount} points reward`
      });

      return res.status(200).json({
        success: true,
        message: `Successfully claimed ${amount} points`,
        remaining_points: totalPoints - amount
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reward claimed successfully",
      reward_type,
      claimed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in claimReward:", error);
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

// Get Achievements
export const getAchievements = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const achievements = await db.achievement.findByUser(userId);

    // Group achievements by type
    const groupedAchievements = {
      points_milestones: achievements.filter(a => a.achievement_type === 'points_milestone'),
      streak_milestones: achievements.filter(a => a.achievement_type === 'streak_milestone'),
      module_milestones: achievements.filter(a => a.achievement_type === 'module_milestone'),
      review_milestones: achievements.filter(a => a.achievement_type === 'review_milestone')
    };

    return res.status(200).json({
      success: true,
      achievements: groupedAchievements,
      total_achievements: achievements.length,
      recent_achievements: achievements.slice(0, 5).map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        badge_icon: achievement.badge_icon,
        achievement_type: achievement.achievement_type,
        unlocked_at: achievement.unlocked_at
      }))
    });
  } catch (error) {
    console.error("Error in getAchievements:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Badges (subset of achievements)
export const getBadges = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const achievements = await db.achievement.findByUser(userId);

    // Filter only badge-type achievements
    const badges = achievements.filter(a => 
      a.achievement_type === 'points_milestone' || 
      a.achievement_type === 'module_milestone'
    );

    return res.status(200).json({
      success: true,
      badges: badges.map(badge => ({
        id: badge.id,
        title: badge.title,
        description: badge.description,
        badge_icon: badge.badge_icon,
        achievement_type: badge.achievement_type,
        unlocked_at: badge.unlocked_at
      })),
      total_badges: badges.length
    });
  } catch (error) {
    console.error("Error in getBadges:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Reward Leaderboard
export const getRewardLeaderboard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { limit = 10 } = req.query;
    
    // This is a simplified implementation
    // In a real app, you'd want to optimize this query
    const allUsers = await db.user.findMany();
    
    const leaderboard = await Promise.all(
      allUsers.map(async (user) => {
        const totalPoints = await db.reward.getTotalPoints(user.id);
        return {
          user_id: user.id,
          username: user.username || user.fullname,
          profile_picture: user.profile_picture,
          total_points: totalPoints
        };
      })
    );

    // Sort by points and take top users
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, Number(limit));

    return res.status(200).json({
      success: true,
      leaderboard: sortedLeaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }))
    });
  } catch (error) {
    console.error("Error in getRewardLeaderboard:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};
