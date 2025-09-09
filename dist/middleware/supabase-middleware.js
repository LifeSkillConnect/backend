"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSupabase = exports.authenticateUser = void 0;
const supabase_1 = require("../config/supabase");
const user_sync_service_1 = require("../services/user-sync.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to authenticate users using either:
 * 1. Your custom JWT tokens (legacy)
 * 2. Supabase JWT tokens (new)
 */
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No valid authorization header'
            });
        }
        const token = authHeader.substring(7);
        // First, try to verify as a Supabase token
        try {
            const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
            if (!error && user) {
                // This is a Supabase token
                const prismaUser = await (0, user_sync_service_1.getPrismaUserBySupabaseId)(user.id);
                if (!prismaUser) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found in database'
                    });
                }
                req.userId = prismaUser.id;
                req.userEmail = prismaUser.email;
                req.supabaseUser = user;
                return next();
            }
        }
        catch (supabaseError) {
            // Not a Supabase token, try custom JWT
            console.log('Not a Supabase token, trying custom JWT...');
        }
        // Try to verify as a custom JWT token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded.userId) {
                // This is a custom JWT token
                req.userId = decoded.userId;
                req.userEmail = decoded.email;
                return next();
            }
        }
        catch (jwtError) {
            console.log('Not a valid JWT token either');
        }
        // If we get here, the token is invalid
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.authenticateUser = authenticateUser;
/**
 * Middleware specifically for Supabase tokens only
 */
const authenticateSupabase = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No valid authorization header'
            });
        }
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid Supabase token'
            });
        }
        const prismaUser = await (0, user_sync_service_1.getPrismaUserBySupabaseId)(user.id);
        if (!prismaUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found in database'
            });
        }
        req.userId = prismaUser.id;
        req.userEmail = prismaUser.email;
        req.supabaseUser = user;
        next();
    }
    catch (error) {
        console.error('Supabase authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.authenticateSupabase = authenticateSupabase;
