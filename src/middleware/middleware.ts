import { Request, Response, NextFunction } from "express";
import { authenticateUser } from "./supabase-middleware";

// Re-export the new hybrid authentication middleware
export const authenticate = authenticateUser;