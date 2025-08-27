export interface SendOtpPayload {
  email: string;
  check_exists: boolean;
}
export interface ValidateEmailPayload {
  email: string;
  otp: string;
}

export interface CreateAccountPayload {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
  username: string;
  dateOfBirth: Date;
  howdidyouhearaboutus?: string;
}
export interface FinishSignUpPayload {
  username: string;
  phoneNumber: string;
  dateOfBirth: Date;
  howdidyouhearaboutus?: string;
}
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface AddModuleToUserPayLoad {
  email: string;
  moduleIds: string[];
}

export interface ModulePayload {
  title: string;
  plan_type: "free" | "premium";
  isCertificationOnCompletion: boolean;
  total_hours: number;
  subtitle_available: boolean;
  description: string;
  features: string[];
}
