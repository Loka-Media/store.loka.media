import { z } from "zod";

export const emailValidator = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordValidator = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const nameValidator = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters");

export const usernameValidator = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must not exceed 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

export const phoneValidator = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number");

export const otpValidator = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

export const urlValidator = z
  .string()
  .min(1, "URL is required")
  .url("Please enter a valid URL");

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const customerRegisterSchema = z
  .object({
    name: nameValidator,
    username: usernameValidator,
    email: emailValidator,
    phone: phoneValidator,
    password: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CustomerRegisterFormData = z.infer<typeof customerRegisterSchema>;

export const creatorRegisterSchema = z
  .object({
    name: nameValidator,
    username: usernameValidator,
    email: emailValidator,
    phone: phoneValidator,
    password: passwordValidator,
    confirmPassword: z.string(),
    creatorUrl: urlValidator,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CreatorRegisterFormData = z.infer<typeof creatorRegisterSchema>;

export const verifyEmailSchema = z.object({
  otp: otpValidator,
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: emailValidator,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: emailValidator,
    otp: otpValidator,
    newPassword: passwordValidator,
    confirmPassword: passwordValidator,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function validateEmail(email: string): true | string {
  const result = emailValidator.safeParse(email);
  return result.success ? true : result.error.issues[0].message;
}

export function validatePassword(password: string): true | string {
  const result = passwordValidator.safeParse(password);
  return result.success ? true : result.error.issues[0].message;
}

export function validateOTP(otp: string): true | string {
  const result = otpValidator.safeParse(otp);
  return result.success ? true : result.error.issues[0].message;
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): true | string {
  return password === confirmPassword ? true : "Passwords don't match";
}
