# Deployment Guide

## 🚀 Deployment Options

### 1. **Railway** (Recommended for beginners)
- Free tier available
- Automatic deployments from GitHub
- Built-in MongoDB support

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically on push to main branch

### 2. **Render**
- Free tier available
- Easy deployment from GitHub
- Automatic HTTPS

**Steps:**
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`

### 3. **Heroku**
- Free tier discontinued, but still popular
- Easy deployment from GitHub

**Steps:**
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Add MongoDB addon: `heroku addons:create mongolab`
4. Deploy: `git push heroku main`

### 4. **Vercel**
- Great for serverless deployment
- Automatic deployments

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure as Node.js project
4. Add environment variables

## 🔧 Environment Variables

Set these in your hosting platform:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

## 📊 MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to environment variables

### Option 2: Local MongoDB
- Install MongoDB locally
- Use connection string: `mongodb://localhost:27017/lifeskill`

## 🔍 Health Check

After deployment, test your API:

```bash
# Health check
curl https://your-app-url.herokuapp.com/health

# Register user
curl -X POST https://your-app-url.herokuapp.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🛠️ Troubleshooting

### Common Issues:
1. **Port not found**: Set `PORT` environment variable
2. **Database connection failed**: Check `MONGODB_URI`
3. **JWT errors**: Verify `JWT_SECRET` and `JWT_REFRESH_SECRET`

### Logs:
- Check platform-specific logs
- Use `console.log()` for debugging
- Monitor application performance 