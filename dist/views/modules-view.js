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
exports.addModuleReview = exports.getModuleReviews = exports.getNewModules = exports.getFeaturedModules = exports.searchModules = exports.updateModuleProgress = exports.continueModule = exports.getModuleLessons = exports.getModuleById = exports.getCompletedModules = exports.getOngoingModules = exports.getAllModules = void 0;
const yup = __importStar(require("yup"));
const supabase_database_service_1 = require("../services/supabase-database.service");
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
const getAllModules = async (req, res) => {
    try {
        const modules = await supabase_database_service_1.db.module.findMany();
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
    }
    catch (error) {
        console.error("Error in getAllModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getAllModules = getAllModules;
// Get Ongoing Modules (3 ongoing modules)
const getOngoingModules = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const ongoingModules = await supabase_database_service_1.db.userModule.findOngoing(userId);
        // Get full module details for each ongoing module
        const modulesWithDetails = await Promise.all(ongoingModules.map(async (userModule) => {
            const module = await supabase_database_service_1.db.module.findMany({
                where: { id: userModule.module_id },
                take: 1
            });
            if (module.length === 0)
                return null;
            return {
                ...module[0],
                progress_percentage: userModule.progress_percentage,
                current_lesson_id: userModule.current_lesson_id,
                started_at: userModule.started_at
            };
        }));
        const filteredModules = modulesWithDetails.filter(module => module !== null);
        return res.status(200).json({
            success: true,
            modules: filteredModules,
            count: filteredModules.length
        });
    }
    catch (error) {
        console.error("Error in getOngoingModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getOngoingModules = getOngoingModules;
// Get Completed Modules (3 completed modules)
const getCompletedModules = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const completedModules = await supabase_database_service_1.db.userModule.findCompleted(userId);
        // Get full module details for each completed module
        const modulesWithDetails = await Promise.all(completedModules.map(async (userModule) => {
            const module = await supabase_database_service_1.db.module.findMany({
                where: { id: userModule.module_id },
                take: 1
            });
            if (module.length === 0)
                return null;
            return {
                ...module[0],
                progress_percentage: userModule.progress_percentage,
                completed_at: userModule.completed_at
            };
        }));
        const filteredModules = modulesWithDetails.filter(module => module !== null);
        return res.status(200).json({
            success: true,
            modules: filteredModules,
            count: filteredModules.length
        });
    }
    catch (error) {
        console.error("Error in getCompletedModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getCompletedModules = getCompletedModules;
// Get Module by ID
const getModuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const modules = await supabase_database_service_1.db.module.findMany({
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
        const lessons = await supabase_database_service_1.db.lesson.findByModule(id);
        const reviews = await supabase_database_service_1.db.review.findByModule(id);
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
    }
    catch (error) {
        console.error("Error in getModuleById:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getModuleById = getModuleById;
// Get Module Lessons
const getModuleLessons = async (req, res) => {
    try {
        const { id } = req.params;
        const lessons = await supabase_database_service_1.db.lesson.findByModule(id);
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
    }
    catch (error) {
        console.error("Error in getModuleLessons:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getModuleLessons = getModuleLessons;
// Continue Module
const continueModule = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;
        // Check if user already has progress on this module
        const existingProgress = await supabase_database_service_1.db.userModule.findByUser(userId);
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
        const userModuleData = {
            user_id: userId,
            module_id: id,
            progress_percentage: 0,
            is_completed: false
        };
        const newUserModule = await supabase_database_service_1.db.userModule.create(userModuleData);
        return res.status(201).json({
            success: true,
            message: "Module started successfully",
            userModule: {
                progress_percentage: newUserModule.progress_percentage,
                current_lesson_id: newUserModule.current_lesson_id,
                is_completed: newUserModule.is_completed
            }
        });
    }
    catch (error) {
        console.error("Error in continueModule:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.continueModule = continueModule;
// Update Module Progress
const updateModuleProgress = async (req, res) => {
    try {
        await moduleProgressSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        const { id } = req.params;
        const { progress_percentage, current_lesson_id } = req.body;
        const updatedUserModule = await supabase_database_service_1.db.userModule.updateProgress(userId, id, progress_percentage);
        // Check if module is completed (100% progress)
        if (progress_percentage >= 100 && !updatedUserModule.is_completed) {
            // Award points for module completion
            const module = await supabase_database_service_1.db.module.findMany({ where: { id }, take: 1 });
            if (module.length > 0) {
                await supabase_database_service_1.db.reward.create({
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
    }
    catch (error) {
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
exports.updateModuleProgress = updateModuleProgress;
// Search Modules
const searchModules = async (req, res) => {
    try {
        const { q, category, plan_type } = req.query;
        let modules = await supabase_database_service_1.db.module.findMany();
        // Apply search filter
        if (q && typeof q === 'string') {
            modules = modules.filter(module => module.title.toLowerCase().includes(q.toLowerCase()) ||
                module.description.toLowerCase().includes(q.toLowerCase()) ||
                module.instructor_name.toLowerCase().includes(q.toLowerCase()));
        }
        // Apply category filter (if categories are implemented)
        if (category && typeof category === 'string') {
            modules = modules.filter(module => module.features.includes(category));
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
    }
    catch (error) {
        console.error("Error in searchModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.searchModules = searchModules;
// Get Featured Modules
const getFeaturedModules = async (req, res) => {
    try {
        // Get modules with highest ratings and student count
        const modules = await supabase_database_service_1.db.module.findMany({
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
    }
    catch (error) {
        console.error("Error in getFeaturedModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getFeaturedModules = getFeaturedModules;
// Get New Modules
const getNewModules = async (req, res) => {
    try {
        const modules = await supabase_database_service_1.db.module.findMany({
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
    }
    catch (error) {
        console.error("Error in getNewModules:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getNewModules = getNewModules;
// Get Module Reviews
const getModuleReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await supabase_database_service_1.db.review.findByModule(id);
        return res.status(200).json({
            success: true,
            reviews: reviews.map(review => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at
            }))
        });
    }
    catch (error) {
        console.error("Error in getModuleReviews:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.getModuleReviews = getModuleReviews;
// Add Module Review
const addModuleReview = async (req, res) => {
    try {
        await reviewSchema.validate(req.body, { abortEarly: false });
        const userId = req.auth.userId;
        const { id } = req.params;
        const { rating, comment } = req.body;
        // Check if user has completed the module
        const userModules = await supabase_database_service_1.db.userModule.findByUser(userId);
        const userModule = userModules.find(um => um.module_id === id);
        if (!userModule || !userModule.is_completed) {
            return res.status(400).json({
                success: false,
                error: "You must complete the module before reviewing it"
            });
        }
        const reviewData = {
            user_id: userId,
            module_id: id,
            rating,
            comment
        };
        const review = await supabase_database_service_1.db.review.create(reviewData);
        // Award points for review
        await supabase_database_service_1.db.reward.create({
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
    }
    catch (error) {
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
exports.addModuleReview = addModuleReview;
