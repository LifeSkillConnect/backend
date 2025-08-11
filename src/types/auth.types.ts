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
  phoneNumber?: string;
  fullName?: string;
  dateOfBirth?: Date;
  howdidyouhearaboutus?: string;
}