# LifeSkill Backend - MVC Architecture

A Node.js + Express.js + TypeScript backend API built with MVC (Model-View-Controller) architecture.

## 🏗️ Architecture Overview

This project follows the **MVC (Model-View-Controller)** pattern with **Node.js**, **Express.js**, **TypeScript**, and **MongoDB**.

### 📁 Project Structure
```
src/
├── index.ts                 # Main entry point
├── controllers/             # Controllers (handle HTTP requests)
│   ├── UserController.ts   # User-related endpoints
│   └── AuthController.ts   # Authentication endpoints
├── models/                 # Models (business logic & data)
│   ├── User.ts            # User data operations
│   └── Auth.ts            # Authentication operations
├── views/                  # Views (response formatting)
│   ├── UserView.ts        # User response formatting
│   └── AuthView.ts        # Auth response formatting
└── config/                 # Configuration
    └── database.ts        # MongoDB connection setup
```

## 🎯 MVC Components

### **Models** (`src/models/`)
- Handle business logic and data operations
- Interact with MongoDB database using Mongoose
- Define data structures and interfaces
- Include password hashing and JWT token generation

### **Views** (`src/views/`)
- Format API responses consistently
- Handle success/error message formatting
- Ensure uniform response structure

### **Controllers** (`src/controllers/`)
- Handle HTTP requests and responses using Express.js
- Coordinate between Models and Views
- Define API routes and endpoints

## 🚀 API Endpoints

### User Management
- `POST /api/users/register` - User registration
- `GET /api/users/:id` - Get user by ID

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

## 🛠️ Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Install MongoDB locally or use MongoDB Atlas
   # Update MONGODB_URI in .env
   ```

4. **Run the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 🔧 Key Features

- **Node.js + Express.js** for server framework
- **TypeScript** for type safety
- **MVC Architecture** for clean separation of concerns
- **MongoDB + Mongoose** for database
- **JWT Authentication** with access and refresh tokens
- **Password Hashing** with bcryptjs
- **CORS Support** for cross-origin requests
- **Error Handling** with consistent error responses
- **Modular Design** for easy maintenance and scaling

## 📝 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔄 Adding New Features

1. **Create Model** - Add business logic in `src/models/`
2. **Create View** - Add response formatting in `src/views/`
3. **Create Controller** - Add HTTP handling in `src/controllers/`
4. **Register Routes** - Add to the appropriate controller

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Password Hashing**: bcryptjs with salt rounds

This MVC structure provides a clean, maintainable, and scalable foundation for your Node.js backend API! 