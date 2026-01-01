"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowLeft,
  Users,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Shield,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiUrl } from "@/lib/getApiUrl";

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
      const apiUrl = getApiUrl();
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
    <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-pink-200 via-yellow-100 to-pink-100 border-r-4 border-black">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300 rounded-full opacity-40 border-4 border-black"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-300 rounded-3xl opacity-30 rotate-12 border-4 border-black"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-purple-300 rounded-2xl opacity-20 -rotate-12 border-4 border-black"></div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">
          {/* Hero Content */}
          <div className="max-w-lg">
            <div className="inline-block bg-yellow-300 border-4 border-black px-4 py-2 rounded-xl mb-6 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-black" />
                <span className="text-sm font-extrabold text-black">SECURE RESET</span>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black">
              Reset Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Password
              </span>
            </h1>

            <p className="text-xl text-black font-bold mb-8 leading-relaxed">
              Don't worry! Enter your email address and we'll send you an OTP to reset your password securely.
            </p>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-yellow-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <Users className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">7+</div>
                <div className="text-xs font-bold text-black">Platforms</div>
              </div>
              <div className="bg-pink-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-pink-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">40K+</div>
                <div className="text-xs font-bold text-black">Products</div>
              </div>
              <div className="bg-purple-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-purple-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">$1M++</div>
                <div className="text-xs font-bold text-black">Revenue</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              {[
                "Secure password reset process",
                "OTP expires in 10 minutes",
                "Get back to creating quickly",
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-black">
                  <div className="w-3 h-3 bg-black rounded-full mr-3 border-2 border-black"></div>
                  <span className="font-bold">{feature}</span>
                </div>
              ))}
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
              href="/auth/login"
              className="inline-flex items-center font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>

          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center lg:text-left mb-8">
                <div className="inline-block bg-pink-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                    Forgot Password?
                  </h2>
                </div>
                <p className="mt-3 text-base font-bold text-black">
                  Enter your email address and we'll send you an OTP to reset your password.
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
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-black" />
                      </div>
                      <input
                        {...register("email")}
                        type="email"
                        autoComplete="email"
                        className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                        {errors.email.message}
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
                          Sending OTP...
                        </div>
                      ) : (
                        "Send Reset OTP"
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
                    Check Your Email
                  </h2>
                </div>
                <p className="mt-3 text-base font-bold text-black">
                  We've sent a 6-digit OTP to{" "}
                  <span className="text-purple-600">{email}</span>
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-200 border-4 border-black rounded-full mb-4">
                  <Mail className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-2xl font-extrabold text-black mb-3">Email Sent!</h3>
                <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-black" />
                    <span className="font-extrabold text-black">OTP Expires in 10 minutes</span>
                  </div>
                  <p className="text-sm font-bold text-black">
                    Please check your inbox for the 6-digit OTP code.
                  </p>
                </div>
                <button
                  onClick={handleProceedToReset}
                  className="w-full py-3 px-4 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-extrabold transition-all focus:outline-none border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  Continue to Reset Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
