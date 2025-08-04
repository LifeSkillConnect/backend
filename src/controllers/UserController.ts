import { Request, Response, Router } from 'express'
import { UserService, UserData } from '../models/User'
import { UserView } from '../views/UserView'

export class UserController {
  public router: Router
  private userService: UserService
  private userView: UserView

  constructor() {
    this.router = Router()
    this.userService = new UserService()
    this.userView = new UserView()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post('/register', this.register.bind(this))
    this.router.get('/:id', this.getUser.bind(this))
  }

  async register(req: Request, res: Response) {
    try {
      const userData: UserData = req.body

      if (!userData.email || !userData.password) {
        return this.userView.error(res, 'Missing required fields', 400)
      }

      // Check if user already exists
      const existingUser = await this.userService.findByEmail(userData.email)
      if (existingUser) {
        return this.userView.error(res, 'Email already exists. Please use a different email.', 409)
      }

      // Create new user
      const newUser = await this.userService.create(userData)

      return this.userView.success(res, 'Signup successful. User is confirmed and can log in immediately.', {
        user_id: newUser.id
      })

    } catch (error) {
      console.error('Registration error:', error)
      return this.userView.error(res, `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500)
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const userId = req.params.id

      if (!userId) {
        return this.userView.error(res, 'User ID is required', 400)
      }

      const user = await this.userService.findById(userId)
      if (!user) {
        return this.userView.error(res, 'User not found', 404)
      }

      return this.userView.success(res, 'User retrieved successfully', user)

    } catch (error) {
      console.error('Get user error:', error)
      return this.userView.error(res, `Failed to retrieve user: ${error instanceof Error ? error.message : 'Unknown error'}`, 500)
    }
  }
} 