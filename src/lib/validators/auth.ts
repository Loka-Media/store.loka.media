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
    "Username cannot contain spaces or special characters. Only letters, numbers, and underscores are allowed."
  );

export const phoneValidator = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(
    (val) => {
      // Must contain only digits, spaces, hyphens, parentheses, dots, and optional leading +
      const validPhonePattern = /^\+?[0-9\s\-().]{7,25}$/;
      if (!validPhonePattern.test(val)) return false;

      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    },
    {
      message: "Please enter a valid phone number (e.g., +44 7123 456789 or 07123 456789)",
    }
  );

export const otpValidator = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

export const urlValidator = z
  .string()
  .min(1, "Creator URL is required")
  .superRefine((url, ctx) => {
    // Check if URL has a protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        message: "URL must start with https:// or http:// (e.g., https://instagram.com/yourhandle)"
      });
      return;
    }
    try {
      new URL(url);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Please enter a valid URL (e.g., https://instagram.com/yourhandle or https://tiktok.com/@yourhandle)"
      });
    }
  });

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

export function validatePhone(phone: string): true | string {
  const result = phoneValidator.safeParse(phone);
  return result.success ? true : result.error.issues[0].message;
}
