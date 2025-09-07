"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Store,
  ArrowLeft,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import LottieAnimation from "@/components/LottieAnimation";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset email");
      }

      setEmail(data.email);
      setEmailSent(true);
      toast.success("Password reset OTP sent to your email!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
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
              RESET YOUR{" "}
              <span className="block text-orange-400">
                PASSWORD
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Don't worry! Enter your email address and we'll send you an OTP to reset your password.
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
                <span>Secure password reset process</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>OTP expires in 10 minutes</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Get back to creating quickly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-xl">
          {/* Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                <Store className="h-7 w-7 text-white" />
              </div>
              <span className="ml-3 text-3xl font-black text-white tracking-tight">
                LOKA
              </span>
            </div>
          </div>

          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>

          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Forgot Password?
                </h2>
                <p className="mt-3 text-base text-gray-300">
                  Enter your email address and we'll send you an OTP to reset your password.
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
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register("email")}
                          type="email"
                          autoComplete="email"
                          className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                          placeholder="Enter your email address"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-400">
                          {errors.email.message}
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
              <div className="text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Check Your Email
                </h2>
                <p className="mt-3 text-base text-gray-300">
                  We've sent a 6-digit OTP to{" "}
                  <span className="text-orange-400 font-semibold">{email}</span>
                </p>
              </div>

              <div className="mt-8">
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/50 py-8 px-6 lg:px-8 shadow-xl rounded-xl text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Email Sent!</h3>
                  <p className="text-gray-300 mb-6">
                    Please check your inbox for the 6-digit OTP. It will expire in 10 minutes.
                  </p>
                  <button
                    onClick={handleProceedToReset}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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