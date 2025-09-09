"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const supabase_middleware_1 = require("./supabase-middleware");
// Re-export the new hybrid authentication middleware
exports.authenticate = supabase_middleware_1.authenticateUser;
