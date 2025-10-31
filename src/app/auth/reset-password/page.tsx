"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Store,
  ArrowLeft,
  Eye,
  EyeOff,
  Users,
  ShoppingBag,
  TrendingUp,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import LottieAnimation from "@/components/LottieAnimation";

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
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent"></div>

        {/* Lottie Animation */}
        <div className="absolute inset-0">
          <LottieAnimation
            animationPath="/fly-man.json"
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
            className="opacity-30"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16 text-white">
          {/* Hero Content */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6">
              CREATE NEW{" "}
              <span className="block text-orange-400">
                PASSWORD
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Enter the OTP we sent to your email and create a secure new password for your account.
            </p>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">7+</div>
                <div className="text-sm text-gray-400">Social Media Platforms</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">40K+</div>
                <div className="text-sm text-gray-400">Custom and Trending Products</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">$1M+++</div>
                <div className="text-sm text-gray-400">Start Making Millions</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Secure password encryption</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>All sessions will be logged out</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Enhanced account security</span>
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
              className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Entry
            </Link>
          </div>

          {!resetSuccess ? (
            <>
              {/* Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Reset Password
                </h2>
                <p className="mt-3 text-base text-gray-300">
                  Enter the OTP from your email and your new password.
                </p>
              </div>

              {/* Form */}
              <div className="mt-8">
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/50 py-8 px-6 lg:px-8 shadow-xl rounded-xl">
                  <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-white mb-2"
                      >
                        Email address
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        autoComplete="email"
                        className="block w-full px-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Enter your email address"
                        readOnly={!!emailParam}
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* OTP Field */}
                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-sm font-semibold text-white mb-2"
                      >
                        6-Digit OTP
                      </label>
                      <input
                        {...register("otp")}
                        type="text"
                        maxLength={6}
                        className="block w-full px-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-center text-2xl tracking-widest font-mono"
                        placeholder="123456"
                        autoComplete="one-time-code"
                      />
                      {errors.otp && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.otp.message}
                        </p>
                      )}
                    </div>

                    {/* New Password Field */}
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-semibold text-white mb-2"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register("newPassword")}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="block w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                          placeholder="Enter your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-300"
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
                        <p className="mt-2 text-sm text-red-400">
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-white mb-2"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="block w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                          placeholder="Confirm your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-300"
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
                        <p className="mt-2 text-sm text-red-400">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Resetting Password...
                          </div>
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Password Reset!
                </h2>
                <p className="mt-3 text-base text-gray-300">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <div className="mt-8">
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/50 py-8 px-6 lg:px-8 shadow-xl rounded-xl text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                  <p className="text-gray-300 mb-6">
                    Your password has been changed successfully. For security reasons, you've been logged out of all devices.
                  </p>
                  <button
                    onClick={handleGoToLogin}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Go to Sign In
                  </button>
                </div>
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
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}