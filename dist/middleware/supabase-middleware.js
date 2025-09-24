"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const supabase_1 = require("../config/supabase");
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
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        const dbUser = await supabase_database_service_1.db.user.findUnique({ email: user.email });
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
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
exports.authenticate = authenticate;
