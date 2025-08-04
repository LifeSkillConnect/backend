import { Request, Response, Router } from 'express'
import { AuthModel } from '../models/Auth'
import { AuthView } from '../views/AuthView'

export class AuthController {
  public router: Router
  private authModel: AuthModel
  private authView: AuthView

  constructor() {
    this.router = Router()
    this.authModel = new AuthModel()
    this.authView = new AuthView()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post('/login', this.login.bind(this))
    this.router.post('/logout', this.logout.bind(this))
    this.router.post('/refresh', this.refreshToken.bind(this))
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return this.authView.error(res, 'Email and password are required', 400)
      }

      const result = await this.authModel.login(email, password)
      return this.authView.loginSuccess(res, result.user, result.session)

    } catch (error) {
      console.error('Login error:', error)
      return this.authView.error(res, `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 401)
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return this.authView.error(res, 'Authorization header required', 401)
      }

      await this.authModel.logout(authHeader)
      return this.authView.logoutSuccess(res)

    } catch (error) {
      console.error('Logout error:', error)
      return this.authView.error(res, `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500)
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body

      if (!refresh_token) {
        return this.authView.error(res, 'Refresh token is required', 400)
      }

      const result = await this.authModel.refreshToken(refresh_token)
      return this.authView.tokenRefreshed(res, result.user, result.session)

    } catch (error) {
      console.error('Token refresh error:', error)
      return this.authView.error(res, `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 401)
    }
  }
} 