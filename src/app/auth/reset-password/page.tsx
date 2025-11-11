"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  Sparkles,
  Key,
} from "lucide-react";
import toast from "react-hot-toast";

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
    },
  });

  // Set email from URL params
  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setResetSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100 border-r-4 border-black">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-300 rounded-full opacity-40 border-4 border-black"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-300 rounded-3xl opacity-30 rotate-12 border-4 border-black"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-pink-300 rounded-2xl opacity-20 -rotate-12 border-4 border-black"></div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">
          {/* Hero Content */}
          <div className="max-w-lg">
            <div className="inline-block bg-purple-300 border-4 border-black px-4 py-2 rounded-xl mb-6 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-black" />
                <span className="text-sm font-extrabold text-black">SECURE RESET</span>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black">
              Create New
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Password
              </span>
            </h1>

            <p className="text-xl text-black font-bold mb-8 leading-relaxed">
              Enter the OTP we sent to your email and create a secure new password for your account.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3">
              {[
                "Secure password encryption",
                "All sessions will be logged out",
                "Enhanced account security",
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-black">
                  <div className="w-3 h-3 bg-black rounded-full mr-3 border-2 border-black"></div>
                  <span className="font-bold">{feature}</span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="mt-8 bg-purple-200 border-4 border-black rounded-2xl p-4 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-xl">
                  <Shield className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <div className="font-extrabold text-black">Bank-Level Security</div>
                  <div className="text-sm font-bold text-black">Your data is encrypted end-to-end</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-xl">

          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Entry
            </Link>
          </div>

          {!resetSuccess ? (
            <>
              {/* Header */}
              <div className="text-center lg:text-left mb-8">
                <div className="inline-block bg-pink-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                    Reset Password
                  </h2>
                </div>
                <p className="mt-3 text-base font-bold text-black">
                  Enter the OTP from your email and your new password.
                </p>
              </div>

              {/* Form */}
              <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-extrabold text-black mb-2"
                    >
                      Email address
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      className="block w-full px-3 py-3 bg-gray-100 border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
                      placeholder="Enter your email address"
                      readOnly={!!emailParam}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* OTP Field */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-extrabold text-black mb-2"
                    >
                      6-Digit OTP
                    </label>
                    <input
                      {...register("otp")}
                      type="text"
                      maxLength={6}
                      className="block w-full px-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black text-center text-2xl tracking-widest font-mono"
                      placeholder="123456"
                      autoComplete="one-time-code"
                    />
                    {errors.otp && (
                      <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                        {errors.otp.message}
                      </p>
                    )}
                  </div>

                  {/* New Password Field */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-extrabold text-black mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <input
                        {...register("newPassword")}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                        placeholder="Enter your new password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-black hover:text-gray-700 focus:outline-none transition-colors p-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-extrabold text-black mb-2"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <input
                        {...register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                        placeholder="Confirm your new password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-black hover:text-gray-700 focus:outline-none transition-colors p-1"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Resetting Password...
                        </div>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center lg:text-left mb-8">
                <div className="inline-block bg-green-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                    Password Reset!
                  </h2>
                </div>
                <p className="mt-3 text-base font-bold text-black">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-200 border-4 border-black rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-2xl font-extrabold text-black mb-3">Password Updated!</h3>
                <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5 text-black" />
                    <span className="font-extrabold text-black">Security Notice</span>
                  </div>
                  <p className="text-sm font-bold text-black mt-2">
                    For security reasons, you've been logged out of all devices. Please sign in again with your new password.
                  </p>
                </div>
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-3 px-4 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-extrabold transition-all focus:outline-none border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  Go to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-black border-t-transparent"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
