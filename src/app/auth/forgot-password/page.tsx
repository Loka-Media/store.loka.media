"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Users, ShoppingBag, TrendingUp, Shield, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/auth";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validators/auth";
import { extractErrorMessage } from "@/lib/utils/error-handler";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data.email);
      setEmail(data.email);
      setEmailSent(true);
      toast.success("Password reset OTP sent to your email!");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="w-full lg:flex-1 relative overflow-hidden bg-background lg:border-r-4 border-white/10">
        <div className="relative z-10 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-16 py-6 sm:py-8 lg:py-0 mt-16 lg:mt-16">
          <div className="max-w-lg">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                Reset Your Password
              </h1>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8 lg:mb-12 leading-relaxed font-medium">
              Don't worry! Enter your email address and we'll send you an OTP to reset your password securely.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 sm:space-y-3 mb-8">
              {[
                "Secure password reset process",
                "OTP expires in 10 minutes",
                "Get back to creating quickly",
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 sm:mr-3"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-white/80 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Info Card */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">Secure Process</div>
                  <div className="text-xs text-white/60 font-medium">Your account is protected at every step</div>
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
              href="/auth/login"
              className="inline-flex items-center font-bold text-orange-500 hover:text-orange-600 transition-colors text-xs sm:text-sm underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>

          {!emailSent ? (
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
                      Forgot Password?
                    </h2>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 font-medium">
                      Enter your email address and we'll send you an OTP to reset your password
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
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-white/50" />
                        </div>
                        <input
                          {...register("email")}
                          type="email"
                          autoComplete="email"
                          className="block w-full pl-10 pr-3 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs sm:text-sm"
                          placeholder="Enter your email address"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-xs text-red-400 font-medium">
                          {errors.email.message}
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
                            Sending OTP...
                          </div>
                        ) : (
                          "Send Reset OTP"
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
                    <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
                    Check Your Email
                  </h2>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 font-medium">
                    We've sent a 6-digit OTP to{" "}
                    <span className="text-white font-semibold">{email}</span>
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 my-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-white/60" />
                      <span className="font-semibold text-white text-xs sm:text-sm">OTP Expires in 10 minutes</span>
                    </div>
                    <p className="text-xs text-white/60 font-medium">
                      Please check your inbox for the 6-digit OTP code.
                    </p>
                  </div>
                  <button
                    onClick={handleProceedToReset}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-extrabold transition-all focus:outline-none"
                  >
                    Continue to Reset Password
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
