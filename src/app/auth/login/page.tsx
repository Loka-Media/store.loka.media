// pages/auth/login.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Users,
  ShoppingBag,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// --- Login Form Schema ---
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// --- Main Login Page Content Component ---
function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        const returnUrl = searchParams.get("returnUrl") || "/dashboard";
        router.push(returnUrl);
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const errorWithResponse = error as {
          response?: { data?: { requiresVerification?: boolean } };
        };
        if (errorWithResponse.response?.data?.requiresVerification) {
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(data.email)}`
          );
        }
      }
    } finally {
      setLoading(false);
    }
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
                <Sparkles className="w-5 h-5 text-black" />
                <span className="text-sm font-extrabold text-black">WELCOME BACK!</span>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black">
              Sign In to Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Creative Hub
              </span>
            </h1>

            <p className="text-xl text-black font-bold mb-8 leading-relaxed">
              Access your account, explore amazing products, and connect with creators worldwide.
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
                "Browse unique custom products",
                "Support your favorite creators",
                "Access exclusive content",
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-black">
                  <div className="w-3 h-3 bg-black rounded-full mr-3 border-2 border-black"></div>
                  <span className="font-bold">{feature}</span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-extrabold transition-all border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                Start Your Journey Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-xl">
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-block bg-pink-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                Welcome Back!
              </h2>
            </div>
            <p className="mt-3 text-base font-bold text-black">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
              >
                Sign up here
              </Link>
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
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-extrabold text-black mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-black" />
                  </div>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                    placeholder="Enter your password"
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
                {errors.password && (
                  <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
                >
                  Forgot password?
                </Link>
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
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Set display name for debugging
LoginPageContent.displayName = "LoginPageContent";

// --- Page Wrapper with Suspense ---
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-black border-t-transparent"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
