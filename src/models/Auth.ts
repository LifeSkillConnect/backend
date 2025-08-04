import jwt from 'jsonwebtoken'
import { UserService, User } from './User'

export interface AuthResult {
  user: any
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export class AuthModel {
  private userService: UserService
  private jwtSecret: string
  private jwtRefreshSecret: string

  constructor() {
    this.userService = new UserService()
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.userService.findByEmail(email)
      
      if (!user) {
        throw new Error('Invalid email or password')
      }

      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        throw new Error('Invalid email or password')
      }

      const accessToken = this.generateAccessToken(user)
      const refreshToken = this.generateRefreshToken(user)

      return {
        user: {
          id: user._id,
          email: user.email,
          phone_number: user.phone_number,
          username: user.username,
          full_name: user.full_name
        },
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Date.now() + (15 * 60 * 1000) // 15 minutes
        }
      }
    } catch (error) {
      throw new Error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async logout(authHeader: string): Promise<void> {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just validate it
      const token = authHeader.replace('Bearer ', '')
      jwt.verify(token, this.jwtSecret)
    } catch (error) {
      throw new Error(`Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any
      const user = await this.userService.findById(decoded.userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      const newAccessToken = this.generateAccessToken(user)
      const newRefreshToken = this.generateRefreshToken(user)

      return {
        user: {
          id: user._id,
          email: user.email,
          phone_number: user.phone_number,
          username: user.username,
          full_name: user.full_name
        },
        session: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_at: Date.now() + (15 * 60 * 1000) // 15 minutes
        }
      }
    } catch (error) {
      throw new Error(`Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCurrentUser(authHeader: string): Promise<any> {
    try {
      const token = authHeader.replace('Bearer ', '')
      const decoded = jwt.verify(token, this.jwtSecret) as any
      const user = await this.userService.findById(decoded.userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      return {
        id: user._id,
        email: user.email,
        phone_number: user.phone_number,
        username: user.username,
        full_name: user.full_name
      }
    } catch (error) {
      throw new Error(`Get user error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user._id, email: user.email },
      this.jwtSecret,
      { expiresIn: '15m' }
    )
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user._id },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    )
  }
} 