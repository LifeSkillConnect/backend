"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_database_service_1 = require("../services/supabase-database.service");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No valid authorization header'
            });
        }
        const token = authHeader.substring(7);
        // Verify the custom JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.userId || !decoded.email) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token payload'
            });
        }
        // Find user in database using the decoded email
        const dbUser = await supabase_database_service_1.db.user.findUnique({ email: decoded.email });
        if (!dbUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found in database'
            });
        }
        req.userId = dbUser.id;
        req.userEmail = dbUser.email;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
exports.authenticate = authenticate;
