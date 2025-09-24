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
exports.getRewardLeaderboard = exports.getBadges = exports.getAchievements = exports.claimReward = exports.getRewardHistory = exports.getTotalRewards = void 0;
const yup = __importStar(require("yup"));
const supabase_database_service_1 = require("../services/supabase-database.service");
// Validation schemas
const claimRewardSchema = yup.object({
    reward_type: yup.string().oneOf(['points', 'badge', 'certificate']).required(),
    amount: yup.number().min(1).optional(),
});
// Get Total Rewards (180 pts)
const getTotalRewards = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const totalPoints = await supabase_database_service_1.db.reward.getTotalPoints(userId);
        const achievements = await supabase_database_service_1.db.achievement.findByUser(userId);
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
    }
    catch (error) {
        console.error("Error in getTotalRewards:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getTotalRewards = getTotalRewards;
// Get Reward History
const getRewardHistory = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { limit = 20, offset = 0 } = req.query;
        const rewards = await supabase_database_service_1.db.reward.findByUser(userId);
        // Apply pagination
        const paginatedRewards = rewards.slice(Number(offset), Number(offset) + Number(limit));
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
    }
    catch (error) {
        console.error("Error in getRewardHistory:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getRewardHistory = getRewardHistory;
// Claim Reward (placeholder - implement based on your reward system)
const claimReward = async (req, res) => {
    try {
        await claimRewardSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        const { reward_type, amount } = req.body;
        // This is a placeholder implementation
        // You would implement actual reward claiming logic here
        // For example: redeem points for certificates, badges, etc.
        if (reward_type === 'points' && amount) {
            // Check if user has enough points
            const totalPoints = await supabase_database_service_1.db.reward.getTotalPoints(userId);
            if (totalPoints < amount) {
                return res.status(400).json({
                    success: false,
                    error: "Insufficient points to claim this reward"
                });
            }
            // Create a "claimed" reward entry (negative points to deduct)
            await supabase_database_service_1.db.reward.create({
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
    }
    catch (error) {
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
exports.claimReward = claimReward;
// Get Achievements
const getAchievements = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const achievements = await supabase_database_service_1.db.achievement.findByUser(userId);
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
    }
    catch (error) {
        console.error("Error in getAchievements:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getAchievements = getAchievements;
// Get Badges (subset of achievements)
const getBadges = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const achievements = await supabase_database_service_1.db.achievement.findByUser(userId);
        // Filter only badge-type achievements
        const badges = achievements.filter(a => a.achievement_type === 'points_milestone' ||
            a.achievement_type === 'module_milestone');
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
    }
    catch (error) {
        console.error("Error in getBadges:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getBadges = getBadges;
// Get Reward Leaderboard
const getRewardLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        // This is a simplified implementation
        // In a real app, you'd want to optimize this query
        const allUsers = await supabase_database_service_1.db.user.findMany();
        const leaderboard = await Promise.all(allUsers.map(async (user) => {
            const totalPoints = await supabase_database_service_1.db.reward.getTotalPoints(user.id);
            return {
                user_id: user.id,
                username: user.username || user.fullname,
                profile_picture: user.profile_picture,
                total_points: totalPoints
            };
        }));
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
    }
    catch (error) {
        console.error("Error in getRewardLeaderboard:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getRewardLeaderboard = getRewardLeaderboard;
