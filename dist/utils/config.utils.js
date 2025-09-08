"use strict";
/**
 * Configuration validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOAuthConfig = exports.validateMobileAppConfig = exports.validateGoogleOAuthConfig = void 0;
const validateGoogleOAuthConfig = () => {
    const requiredEnvVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI'
    ];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        console.error('❌ Missing Google OAuth environment variables:', missing);
        return false;
    }
    console.log('✅ Google OAuth configuration is valid');
    return true;
};
exports.validateGoogleOAuthConfig = validateGoogleOAuthConfig;
const validateMobileAppConfig = () => {
    const scheme = process.env.MOBILE_APP_SCHEME || 'lifeskillsconnect';
    console.log(`📱 Mobile app scheme: ${scheme}`);
    return scheme;
};
exports.validateMobileAppConfig = validateMobileAppConfig;
const logOAuthConfig = () => {
    console.log('🔧 OAuth Configuration:');
    console.log('- Google Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('- Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('- Google Redirect URI:', process.env.GOOGLE_REDIRECT_URI || '❌ Missing');
    console.log('- Mobile App Scheme:', process.env.MOBILE_APP_SCHEME || 'lifeskillsconnect (default)');
};
exports.logOAuthConfig = logOAuthConfig;
