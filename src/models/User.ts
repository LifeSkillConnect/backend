import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface UserData {
  email: string
  password: string
  phone_number?: string
  username?: string
  full_name?: string
  referral_id?: string
}

export interface User extends Document {
  email: string
  password: string
  phone_number?: string
  username?: string
  full_name?: string
  referral_id?: string
  created_at: Date
  updated_at: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone_number: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  full_name: {
    type: String,
    trim: true
  },
  referral_id: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export const UserModel = mongoose.model<User>('User', userSchema)

export class UserService {
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await UserModel.findOne({ email: email.toLowerCase() })
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async create(userData: UserData): Promise<User> {
    try {
      const user = new UserModel(userData)
      return await user.save()
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Email already exists')
      }
      throw new Error(`User creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await UserModel.findById(id)
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateById(id: string, updateData: Partial<UserData>): Promise<User | null> {
    try {
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true })
    } catch (error) {
      throw new Error(`Update error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 