import { Request, Response } from "express";
import * as yup from "yup";
import { 
  db, 
  DatabaseModule, 
  DatabaseUserModule, 
  DatabaseLesson, 
  DatabaseReview,
  CreateUserModuleData,
  CreateReviewData
} from "../services/supabase-database.service";

// Validation schemas
const moduleProgressSchema = yup.object({
  progress_percentage: yup.number().min(0).max(100).required(),
  current_lesson_id: yup.string().optional(),
});

const reviewSchema = yup.object({
  rating: yup.number().min(1).max(5).required(),
  comment: yup.string().min(10).max(500).required(),
});

// Get All Modules
export const getAllModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const modules = await db.module.findMany();
    
    return res.status(200).json({
      success: true,
      modules: modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        instructor_name: module.instructor_name,
        instructor_image: module.instructor_image,
        module_cover_image: module.module_cover_image,
        plan_type: module.plan_type,
        total_ratings: module.total_ratings,
        total_students: module.total_students,
        screentime_duration: module.screentime_duration,
        downloadable_resources_count: module.downloadable_resources_count,
        allocated_points: module.allocated_points,
        is_certification_on_completion: module.is_certification_on_completion,
        features: module.features,
        created_at: module.created_at
      }))
    });
  } catch (error) {
    console.error("Error in getAllModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Ongoing Modules (3 ongoing modules)
export const getOngoingModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    const ongoingModules = await db.userModule.findOngoing(userId);
    
    // Get full module details for each ongoing module
    const modulesWithDetails = await Promise.all(
      ongoingModules.map(async (userModule) => {
        const module = await db.module.findMany({
          where: { id: userModule.module_id },
          take: 1
        });
        
        if (module.length === 0) return null;
        
        return {
          ...module[0],
          progress_percentage: userModule.progress_percentage,
          current_lesson_id: userModule.current_lesson_id,
          started_at: userModule.started_at
        };
      })
    );

    const filteredModules = modulesWithDetails.filter(module => module !== null);

    return res.status(200).json({
      success: true,
      modules: filteredModules,
      count: filteredModules.length
    });
  } catch (error) {
    console.error("Error in getOngoingModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Completed Modules (3 completed modules)
export const getCompletedModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    const completedModules = await db.userModule.findCompleted(userId);
    
    // Get full module details for each completed module
    const modulesWithDetails = await Promise.all(
      completedModules.map(async (userModule) => {
        const module = await db.module.findMany({
          where: { id: userModule.module_id },
          take: 1
        });
        
        if (module.length === 0) return null;
        
        return {
          ...module[0],
          progress_percentage: userModule.progress_percentage,
          completed_at: userModule.completed_at
        };
      })
    );

    const filteredModules = modulesWithDetails.filter(module => module !== null);

    return res.status(200).json({
      success: true,
      modules: filteredModules,
      count: filteredModules.length
    });
  } catch (error) {
    console.error("Error in getCompletedModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Module by ID
export const getModuleById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const modules = await db.module.findMany({
      where: { id },
      take: 1
    });

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Module not found"
      });
    }

    const module = modules[0];
    const lessons = await db.lesson.findByModule(id);
    const reviews = await db.review.findByModule(id);

    return res.status(200).json({
      success: true,
      module: {
        ...module,
        lessons: lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          order_index: lesson.order_index,
          is_preview: lesson.is_preview
        })),
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at
        }))
      }
    });
  } catch (error) {
    console.error("Error in getModuleById:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Module Lessons
export const getModuleLessons = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const lessons = await db.lesson.findByModule(id);

    return res.status(200).json({
      success: true,
      lessons: lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        video_url: lesson.video_url,
        duration: lesson.duration,
        order_index: lesson.order_index,
        is_preview: lesson.is_preview,
        created_at: lesson.created_at
      }))
    });
  } catch (error) {
    console.error("Error in getModuleLessons:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Continue Module
export const continueModule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).auth.userId;
    const { id } = req.params;
    
    // Check if user already has progress on this module
    const existingProgress = await db.userModule.findByUser(userId);
    const userModule = existingProgress.find(um => um.module_id === id);
    
    if (userModule) {
      return res.status(200).json({
        success: true,
        message: "Continuing existing module",
        userModule: {
          progress_percentage: userModule.progress_percentage,
          current_lesson_id: userModule.current_lesson_id,
          is_completed: userModule.is_completed
        }
      });
    }

    // Create new user module progress
    const userModuleData: CreateUserModuleData = {
      user_id: userId,
      module_id: id,
      progress_percentage: 0,
      is_completed: false
    };

    const newUserModule = await db.userModule.create(userModuleData);

    return res.status(201).json({
      success: true,
      message: "Module started successfully",
      userModule: {
        progress_percentage: newUserModule.progress_percentage,
        current_lesson_id: newUserModule.current_lesson_id,
        is_completed: newUserModule.is_completed
      }
    });
  } catch (error) {
    console.error("Error in continueModule:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Update Module Progress
export const updateModuleProgress = async (req: Request, res: Response): Promise<Response> => {
  try {
    await moduleProgressSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).auth.userId;
    const { id } = req.params;
    const { progress_percentage, current_lesson_id } = req.body;

    const updatedUserModule = await db.userModule.updateProgress(userId, id, progress_percentage);

    // Check if module is completed (100% progress)
    if (progress_percentage >= 100 && !updatedUserModule.is_completed) {
      // Award points for module completion
      const module = await db.module.findMany({ where: { id }, take: 1 });
      if (module.length > 0) {
        await db.reward.create({
          user_id: userId,
          points: module[0].allocated_points,
          source: 'module_completion',
          source_id: id,
          description: `Completed module: ${module[0].title}`
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Module progress updated successfully",
      userModule: {
        progress_percentage: updatedUserModule.progress_percentage,
        current_lesson_id: updatedUserModule.current_lesson_id,
        is_completed: updatedUserModule.is_completed
      }
    });
  } catch (error) {
    console.error("Error in updateModuleProgress:", error);
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

// Search Modules
export const searchModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { q, category, plan_type } = req.query;
    
    let modules = await db.module.findMany();

    // Apply search filter
    if (q && typeof q === 'string') {
      modules = modules.filter(module => 
        module.title.toLowerCase().includes(q.toLowerCase()) ||
        module.description.toLowerCase().includes(q.toLowerCase()) ||
        module.instructor_name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Apply category filter (if categories are implemented)
    if (category && typeof category === 'string') {
      modules = modules.filter(module => 
        module.features.includes(category)
      );
    }

    // Apply plan type filter
    if (plan_type && typeof plan_type === 'string') {
      modules = modules.filter(module => module.plan_type === plan_type);
    }

    return res.status(200).json({
      success: true,
      modules: modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        instructor_name: module.instructor_name,
        instructor_image: module.instructor_image,
        module_cover_image: module.module_cover_image,
        plan_type: module.plan_type,
        total_ratings: module.total_ratings,
        total_students: module.total_students,
        screentime_duration: module.screentime_duration,
        allocated_points: module.allocated_points,
        features: module.features
      })),
      count: modules.length
    });
  } catch (error) {
    console.error("Error in searchModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Featured Modules
export const getFeaturedModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get modules with highest ratings and student count
    const modules = await db.module.findMany({
      orderBy: { total_ratings: 'desc' },
      take: 10
    });

    // Sort by a combination of ratings and student count
    const featuredModules = modules
      .sort((a, b) => (b.total_ratings * b.total_students) - (a.total_ratings * a.total_students))
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      modules: featuredModules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        instructor_name: module.instructor_name,
        instructor_image: module.instructor_image,
        module_cover_image: module.module_cover_image,
        plan_type: module.plan_type,
        total_ratings: module.total_ratings,
        total_students: module.total_students,
        screentime_duration: module.screentime_duration,
        allocated_points: module.allocated_points,
        features: module.features
      }))
    });
  } catch (error) {
    console.error("Error in getFeaturedModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get New Modules
export const getNewModules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const modules = await db.module.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    });

    return res.status(200).json({
      success: true,
      modules: modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        instructor_name: module.instructor_name,
        instructor_image: module.instructor_image,
        module_cover_image: module.module_cover_image,
        plan_type: module.plan_type,
        total_ratings: module.total_ratings,
        total_students: module.total_students,
        screentime_duration: module.screentime_duration,
        allocated_points: module.allocated_points,
        features: module.features,
        created_at: module.created_at
      }))
    });
  } catch (error) {
    console.error("Error in getNewModules:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get Module Reviews
export const getModuleReviews = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const reviews = await db.review.findByModule(id);

    return res.status(200).json({
      success: true,
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      }))
    });
  } catch (error) {
    console.error("Error in getModuleReviews:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Add Module Review
export const addModuleReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    await reviewSchema.validate(req.body, { abortEarly: false });
    
    const userId = (req as any).auth.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if user has completed the module
    const userModules = await db.userModule.findByUser(userId);
    const userModule = userModules.find(um => um.module_id === id);
    
    if (!userModule || !userModule.is_completed) {
      return res.status(400).json({
        success: false,
        error: "You must complete the module before reviewing it"
      });
    }

    const reviewData: CreateReviewData = {
      user_id: userId,
      module_id: id,
      rating,
      comment
    };

    const review = await db.review.create(reviewData);

    // Award points for review
    await db.reward.create({
      user_id: userId,
      points: 10, // Points for writing a review
      source: 'review',
      source_id: review.id,
      description: `Reviewed module: ${id}`
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      }
    });
  } catch (error) {
    console.error("Error in addModuleReview:", error);
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
