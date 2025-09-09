"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaUserBySupabaseId = exports.syncSupabaseUserToPrisma = void 0;
const authentication_view_1 = require("../views/authentication-view");
const supabase_1 = require("../config/supabase");
/**
 * Syncs a Supabase Auth user with your Prisma database
 * Creates a new user if they don't exist, updates if they do
 */
const syncSupabaseUserToPrisma = async (supabaseUser) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        // Extract user data from Supabase Auth user
        const email = supabaseUser.email;
        const fullname = ((_a = supabaseUser.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) ||
            ((_b = supabaseUser.user_metadata) === null || _b === void 0 ? void 0 : _b.name) ||
            `${((_c = supabaseUser.user_metadata) === null || _c === void 0 ? void 0 : _c.given_name) || ''} ${((_d = supabaseUser.user_metadata) === null || _d === void 0 ? void 0 : _d.family_name) || ''}`.trim() ||
            'User';
        const profilePicture = ((_e = supabaseUser.user_metadata) === null || _e === void 0 ? void 0 : _e.avatar_url) ||
            ((_f = supabaseUser.user_metadata) === null || _f === void 0 ? void 0 : _f.picture) ||
            null;
        // Determine auth provider based on Supabase app_metadata
        const authProvider = ((_g = supabaseUser.app_metadata) === null || _g === void 0 ? void 0 : _g.provider) || 'EMAIL';
        // Check if user exists in Prisma
        let existingUser = await authentication_view_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            // Update existing user with latest data from Supabase
            const updatedUser = await authentication_view_1.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    fullname,
                    profilePicture,
                    authProvider: authProvider.toUpperCase(),
                    isActive: true,
                }
            });
            return {
                id: updatedUser.id,
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                profilePicture: updatedUser.profilePicture || undefined,
                authProvider: updatedUser.authProvider,
                phoneNumber: updatedUser.phoneNumber || undefined,
                username: updatedUser.username || undefined,
                dateOfBirth: updatedUser.dateOfBirth || undefined,
                howdidyouhearaboutus: updatedUser.howdidyouhearaboutus || undefined,
            };
        }
        else {
            // Create new user
            const newUser = await authentication_view_1.prisma.user.create({
                data: {
                    email,
                    fullname,
                    profilePicture,
                    authProvider: authProvider.toUpperCase(),
                    isActive: true,
                    role: 'USER',
                }
            });
            return {
                id: newUser.id,
                email: newUser.email,
                fullname: newUser.fullname,
                profilePicture: newUser.profilePicture || undefined,
                authProvider: newUser.authProvider,
                phoneNumber: newUser.phoneNumber || undefined,
                username: newUser.username || undefined,
                dateOfBirth: newUser.dateOfBirth || undefined,
                howdidyouhearaboutus: newUser.howdidyouhearaboutus || undefined,
            };
        }
    }
    catch (error) {
        console.error('Error syncing Supabase user to Prisma:', error);
        throw new Error('Failed to sync user data');
    }
};
exports.syncSupabaseUserToPrisma = syncSupabaseUserToPrisma;
/**
 * Gets a Prisma user by Supabase user ID
 */
const getPrismaUserBySupabaseId = async (supabaseUserId) => {
    try {
        // First, get the Supabase user to get their email
        const { data: supabaseUser, error } = await supabase_1.supabaseAdmin.auth.admin.getUserById(supabaseUserId);
        if (error || !supabaseUser.user) {
            console.error('Error fetching Supabase user:', error);
            return null;
        }
        // Then find the corresponding Prisma user
        const prismaUser = await authentication_view_1.prisma.user.findUnique({
            where: { email: supabaseUser.user.email }
        });
        if (!prismaUser) {
            return null;
        }
        return {
            id: prismaUser.id,
            email: prismaUser.email,
            fullname: prismaUser.fullname,
            profilePicture: prismaUser.profilePicture || undefined,
            authProvider: prismaUser.authProvider,
            phoneNumber: prismaUser.phoneNumber || undefined,
            username: prismaUser.username || undefined,
            dateOfBirth: prismaUser.dateOfBirth || undefined,
            howdidyouhearaboutus: prismaUser.howdidyouhearaboutus || undefined,
        };
    }
    catch (error) {
        console.error('Error getting Prisma user by Supabase ID:', error);
        return null;
    }
};
exports.getPrismaUserBySupabaseId = getPrismaUserBySupabaseId;
