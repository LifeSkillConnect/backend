import { Response } from 'express'

export class AuthView {
  success(res: Response, message: string, data?: any): Response {
    const response = {
      success: true,
      message,
      ...(data && { data })
    }

    return res.status(200).json(response)
  }

  error(res: Response, message: string, status: number = 400): Response {
    const response = {
      success: false,
      error: message
    }

    return res.status(status).json(response)
  }

  loginSuccess(res: Response, user: any, session: any): Response {
    return this.success(res, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        username: user.username,
        full_name: user.full_name
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })
  }

  logoutSuccess(res: Response): Response {
    return this.success(res, 'Logout successful')
  }

  tokenRefreshed(res: Response, user: any, session: any): Response {
    return this.success(res, 'Token refreshed successfully', {
      user: {
        id: user.id,
        email: user.email
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })
  }
} 