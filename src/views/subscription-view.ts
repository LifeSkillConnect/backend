import { Request, Response } from "express";
import * as yup from "yup";
import { 
  db, 
  DatabaseSubscription,
  CreateSubscriptionData
} from "../services/supabase-database.service";

// Validation schemas
const upgradeSchema = yup.object({
  plan_type: yup.string().oneOf(['premium']).required(),
  payment_method: yup.string().optional(),
});

// Get Subscription Status
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const subscription = await db.subscription.findByUser(userId);

    if (!subscription) {
      // User has no active subscription (free tier)
      return res.status(200).json({
        success: true,
        subscription: {
          plan_type: 'free',
          status: 'active',
          is_premium: false,
          start_date: null,
          end_date: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      subscription: {
        plan_type: subscription.plan_type,
        status: subscription.status,
        is_premium: subscription.plan_type === 'premium',
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        created_at: subscription.created_at
      }
    });
  } catch (error) {
    console.error("Error in getSubscriptionStatus:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Upgrade to Premium
export const upgradeToPremium = async (req: Request, res: Response): Promise<Response> => {
  try {
    await upgradeSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).auth.userId;
    const { plan_type, payment_method } = req.body;

    // Check if user already has premium
    const existingSubscription = await db.subscription.findByUser(userId);
    
    if (existingSubscription && existingSubscription.plan_type === 'premium' && existingSubscription.status === 'active') {
      return res.status(400).json({
        success: false,
        error: "You already have an active premium subscription"
      });
    }

    // Create premium subscription
    const subscriptionData: CreateSubscriptionData = {
      user_id: userId,
      plan_type: 'premium',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    };

    const subscription = await db.subscription.create(subscriptionData);

    // Create notification for successful upgrade
    await db.notification.create({
      user_id: userId,
      title: "Welcome to Premium!",
      message: "You now have access to all premium modules and features.",
      type: 'system'
    });

    return res.status(201).json({
      success: true,
      message: "Successfully upgraded to premium",
      subscription: {
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date
      }
    });
  } catch (error) {
    console.error("Error in upgradeToPremium:", error);
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

// Get Subscription Benefits
export const getSubscriptionBenefits = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const subscription = await db.subscription.findByUser(userId);
    const isPremium = subscription && subscription.plan_type === 'premium' && subscription.status === 'active';

    const benefits = {
      free: {
        features: [
          "Access to basic modules",
          "Basic progress tracking",
          "Community support",
          "Basic certificates"
        ],
        limitations: [
          "Limited module access",
          "No premium content",
          "Basic analytics"
        ]
      },
      premium: {
        features: [
          "Access to ALL modules",
          "Advanced progress tracking",
          "Priority support",
          "Premium certificates",
          "Advanced analytics",
          "Mentor support",
          "Faster growth tracking",
          "Exclusive content",
          "Downloadable resources",
          "Offline access"
        ],
        limitations: []
      }
    };

    return res.status(200).json({
      success: true,
      current_plan: isPremium ? 'premium' : 'free',
      benefits: isPremium ? benefits.premium : benefits.free,
      upgrade_benefits: benefits.premium,
      is_premium: isPremium
    });
  } catch (error) {
    console.error("Error in getSubscriptionBenefits:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Cancel Subscription
export const cancelSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    const subscription = await db.subscription.findByUser(userId);
    
    if (!subscription || subscription.plan_type !== 'premium') {
      return res.status(400).json({
        success: false,
        error: "No active premium subscription found"
      });
    }

    // Update subscription status to cancelled
    const updatedSubscription = await db.subscription.update(userId, {
      status: 'cancelled'
    });

    // Create notification for cancellation
    await db.notification.create({
      user_id: userId,
      title: "Subscription Cancelled",
      message: "Your premium subscription has been cancelled. You'll retain access until the end of your billing period.",
      type: 'system'
    });

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        plan_type: updatedSubscription.plan_type,
        status: updatedSubscription.status,
        end_date: updatedSubscription.end_date
      }
    });
  } catch (error) {
    console.error("Error in cancelSubscription:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Subscription History
export const getSubscriptionHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    
    // This would typically fetch from a separate history table
    // For now, we'll return the current subscription info
    const subscription = await db.subscription.findByUser(userId);

    const history = subscription ? [{
      plan_type: subscription.plan_type,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    }] : [];

    return res.status(200).json({
      success: true,
      history: history,
      total_transactions: history.length
    });
  } catch (error) {
    console.error("Error in getSubscriptionHistory:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};
