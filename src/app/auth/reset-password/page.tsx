"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, Eye, EyeOff, Shield, CheckCircle, Key } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/auth";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validators/auth";
import { extractErrorMessage } from "@/lib/utils/error-handler";

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
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(data.email, data.otp, data.newPassword);
      setResetSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="w-full lg:flex-1 relative overflow-hidden bg-background lg:border-r-4 border-white/10">
        <div className="relative z-10 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-16 py-6 sm:py-8 lg:py-0 mt-16 lg:mt-16">
          <div className="max-w-lg">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                Create New Password
              </h1>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8 lg:mb-12 leading-relaxed font-medium">
              Enter the OTP we sent to your email and create a secure new password for your account.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 sm:space-y-3 mb-8">
              {[
                "Secure password encryption",
                "All sessions will be logged out",
                "Enhanced account security",
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 sm:mr-3"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-white/80 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">Bank-Level Security</div>
                  <div className="text-xs text-white/60 font-medium">Your data is encrypted end-to-end</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex-1 flex flex-col justify-center py-6 px-3 sm:py-8 sm:px-6 lg:py-12 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">

          {/* Back Link */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center font-bold text-orange-500 hover:text-orange-600 transition-colors text-xs sm:text-sm underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Entry
            </Link>
          </div>

          {!resetSuccess ? (
            <>
              {/* Form */}
              <div
                className="bg-black/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8 relative overflow-hidden"
                style={{
                  borderRadius: '1rem',
                }}
              >
                {/* Gradient Border */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: '1px',
                    background: 'linear-gradient(270deg, #000000 0%, #FFFFFF 100%)',
                    borderRadius: '1rem',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                      Reset Password
                    </h2>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 font-medium">
                      Enter the OTP from your email and your new password
                    </p>
                  </div>
                  <form className="space-y-4 sm:space-y-5 lg:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs sm:text-sm font-semibold text-white mb-2"
                      >
                        Email address
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        autoComplete="email"
                        className="block w-full px-3 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs sm:text-sm disabled:opacity-50"
                        placeholder="Enter your email address"
                        readOnly={!!emailParam}
                      />
                      {errors.email && (
                        <p className="mt-2 text-xs text-red-400 font-medium">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* OTP Field */}
                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-xs sm:text-sm font-semibold text-white mb-2"
                      >
                        6-Digit OTP
                      </label>
                      <input
                        {...register("otp")}
                        type="text"
                        maxLength={6}
                        className="block w-full px-3 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-xl sm:text-2xl tracking-widest transition-all text-xs sm:text-sm"
                        placeholder="123456"
                        autoComplete="one-time-code"
                      />
                      {errors.otp && (
                        <p className="mt-2 text-xs text-red-400 font-medium">
                          {errors.otp.message}
                        </p>
                      )}
                    </div>

                    {/* New Password Field */}
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-xs sm:text-sm font-semibold text-white mb-2"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/50" />
                        </div>
                        <input
                          {...register("newPassword")}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="block w-full pl-10 pr-10 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs sm:text-sm"
                          placeholder="Enter your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-white/50 hover:text-white focus:outline-none transition-colors p-1"
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
                        <p className="mt-2 text-xs text-red-400 font-medium">
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-xs sm:text-sm font-semibold text-white mb-2"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/50" />
                        </div>
                        <input
                          {...register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="block w-full pl-10 pr-10 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs sm:text-sm"
                          placeholder="Confirm your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-white/50 hover:text-white focus:outline-none transition-colors p-1"
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
                        <p className="mt-2 text-xs text-red-400 font-medium">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 sm:pt-3 lg:pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
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
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div
                className="bg-black/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8 relative overflow-hidden text-center"
                style={{
                  borderRadius: '1rem',
                }}
              >
                {/* Gradient Border */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: '1px',
                    background: 'linear-gradient(270deg, #000000 0%, #FFFFFF 100%)',
                    borderRadius: '1rem',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 border border-green-500/50 rounded-full mb-4 mx-auto">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
                    Password Updated!
                  </h2>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 font-medium">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 my-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-white/60" />
                      <span className="font-semibold text-white text-xs sm:text-sm">Security Notice</span>
                    </div>
                    <p className="text-xs text-white/60 font-medium">
                      For security reasons, you've been logged out of all devices. Please sign in again with your new password.
                    </p>
                  </div>
                  <button
                    onClick={handleGoToLogin}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-extrabold transition-all focus:outline-none"
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-white/20 border-t-white"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
