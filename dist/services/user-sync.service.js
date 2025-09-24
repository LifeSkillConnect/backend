"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSupabaseUser = void 0;
const supabase_database_service_1 = require("../services/supabase-database.service");
const syncSupabaseUser = async (supabaseUser) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const email = supabaseUser.email;
    const fullname = ((_a = supabaseUser.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || ((_b = supabaseUser.user_metadata) === null || _b === void 0 ? void 0 : _b.name) || `${((_c = supabaseUser.user_metadata) === null || _c === void 0 ? void 0 : _c.given_name) || ''} ${((_d = supabaseUser.user_metadata) === null || _d === void 0 ? void 0 : _d.family_name) || ''}`.trim() || 'User';
    const profilePicture = ((_e = supabaseUser.user_metadata) === null || _e === void 0 ? void 0 : _e.avatar_url) || ((_f = supabaseUser.user_metadata) === null || _f === void 0 ? void 0 : _f.picture) || undefined;
    const authProvider = (((_g = supabaseUser.app_metadata) === null || _g === void 0 ? void 0 : _g.provider) || 'EMAIL').toUpperCase();
    let user = await supabase_database_service_1.db.user.findUnique({ email });
    if (user) {
        const updated = await supabase_database_service_1.db.user.update(user.id, {
            fullname,
            profile_picture: profilePicture,
            auth_provider: authProvider,
            is_active: true,
        });
        return {
            id: updated.id,
            email: updated.email,
            fullname: updated.fullname,
            profilePicture: updated.profile_picture,
            authProvider,
            phoneNumber: updated.phone_number,
            username: updated.username,
            dateOfBirth: updated.date_of_birth,
            howdidyouhearaboutus: updated.howdidyouhearaboutus,
        };
    }
    const created = await supabase_database_service_1.db.user.create({
        email,
        fullname,
        profile_picture: profilePicture,
        auth_provider: authProvider,
        is_active: true,
        role: 'USER',
    });
    return {
        id: created.id,
        email: created.email,
        fullname: created.fullname,
        profilePicture: created.profile_picture,
        authProvider,
        phoneNumber: created.phone_number,
        username: created.username,
        dateOfBirth: created.date_of_birth,
        howdidyouhearaboutus: created.howdidyouhearaboutus,
    };
};
exports.syncSupabaseUser = syncSupabaseUser;
