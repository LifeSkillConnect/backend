import { Request, Response, NextFunction } from "express";
import { authenticate as supabaseAuthenticate } from "./supabase-middleware";

// Re-export the new hybrid authentication middleware
export const authenticate = supabaseAuthenticate;