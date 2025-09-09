# Supabase Google OAuth Setup Guide

This guide will help you set up Google OAuth using Supabase for your LifeSkill backend.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Google Cloud Console project with OAuth 2.0 credentials

## Step 1: Supabase Configuration

### 1.1 Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL (SUPABASE_URL)
   - Anon public key (SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY)

### 1.2 Configure Google OAuth in Supabase

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Set the redirect URL to: `https://your-domain.com/api/v1/auth/google/callback`

## Step 2: Google Cloud Console Setup

### 2.1 Create OAuth 2.0 Credentials

1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. Set authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `https://your-domain.com/api/v1/auth/google/callback` (for your backend)

## Step 3: Environment Variables

Update your `.env` file with the following:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_REDIRECT_URL=https://your-domain.com/api/v1/auth/google/callback

# Your existing JWT secret (still needed for custom tokens)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Step 4: Testing the Integration

### 4.1 Test Google OAuth Flow

1. Start your server: `npm run dev`
2. Visit: `http://localhost:3000/api/v1/auth/google`
3. You should be redirected to Google's OAuth consent screen
4. After authentication, you should be redirected back to your app

### 4.2 Test API Endpoints

#### Start Google OAuth
```bash
GET /api/v1/auth/google
```

#### Verify Token
```bash
POST /api/v1/auth/verify-token
Authorization: Bearer <your-jwt-token>
```

#### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <your-jwt-token>
```

#### Sign Out
```bash
POST /api/v1/auth/signout
Authorization: Bearer <your-jwt-token>
```

## Step 5: Mobile App Integration

### 5.1 Deep Link Configuration

The OAuth flow will redirect to your mobile app using the configured scheme:

```env
MOBILE_APP_SCHEME=lifeskillsconnect://
```

### 5.2 Mobile App Handling

Your mobile app should handle the deep link with the JWT token:

```
lifeskillsconnect://?token=<jwt-token>
```

## Benefits of This Implementation

1. **Reliable OAuth Flow**: Supabase handles the complex OAuth 2.0 flow
2. **Better Error Handling**: Supabase provides better error messages and handling
3. **Mobile-Friendly**: Improved deep linking and mobile app integration
4. **Hybrid Approach**: Supports both Supabase and custom JWT tokens
5. **User Sync**: Automatic synchronization between Supabase Auth and your Prisma database
6. **Scalable**: Easy to add more OAuth providers (Facebook, Apple, etc.)

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URI in Google Console matches your Supabase configuration
2. **CORS Issues**: Make sure your domain is whitelisted in Supabase
3. **Token Validation**: Check that your JWT_SECRET is properly set
4. **Database Sync**: Verify that the user sync service is working correctly

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs of the OAuth flow and user synchronization.

## Migration Notes

- Your existing users and data remain unchanged
- The new system works alongside your existing authentication
- You can gradually migrate users to the new OAuth flow
- All existing API endpoints continue to work as before
