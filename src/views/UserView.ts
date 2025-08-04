import { Response } from 'express'

export class UserView {
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

  userCreated(res: Response, user: any): Response {
    return this.success(res, 'User created successfully', {
      user_id: user._id,
      email: user.email,
      created_at: user.created_at
    })
  }

  userRetrieved(res: Response, user: any): Response {
    return this.success(res, 'User retrieved successfully', {
      id: user._id,
      email: user.email,
      phone_number: user.phone_number,
      username: user.username,
      full_name: user.full_name,
      referral_id: user.referral_id,
      created_at: user.created_at
    })
  }
} 