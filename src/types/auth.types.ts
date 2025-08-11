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
  password :string,
  phoneNumber: string;
  fullName: string;
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
