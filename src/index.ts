import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { UserController } from './controllers/UserController'
import { AuthController } from './controllers/AuthController'
import { connectDatabase } from './config/database'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/users', new UserController().router)
app.use('/api/auth', new AuthController().router)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
