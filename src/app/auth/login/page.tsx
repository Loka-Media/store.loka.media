// pages/auth/login.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // Corrected path to AuthContext
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Store,
  ArrowRight,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import LottieAnimation from "@/components/LottieAnimation";

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
    <div className="bg-gray-50 flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-white border-r border-gray-200">
        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">
          {/* Hero Content - Updated Messaging */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6 text-gray-900">
              Welcome Back
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Sign in to access your account, explore amazing products, and connect with creators across all platforms.
            </p>

            {/* Stats Section - Updated with new numbers */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-2 mx-auto">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-gray-900">7+</div>
                <div className="text-sm text-gray-600">Social Media Platforms</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-2 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-gray-900">40K+</div>
                <div className="text-sm text-gray-600">Custom and Trending Products</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-gray-900">$1M+++</div>
                <div className="text-sm text-gray-600">Start Making Millions</div>
              </div>
            </div>

            {/* Feature Highlights - Updated Messaging */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                <span>Browse unique custom products</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                <span>Support your favorite creators</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                <span>Access exclusive creator content</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-semibold transition-colors"
            >
              Start Your Journey Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-xl">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Or{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                create a new account
              </Link>
            </p>
          </div>
          {/* Form */}
          <div className="mt-8">
            <div className="bg-white border border-gray-200 py-8 px-6 lg:px-8 shadow-sm rounded-xl">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
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
                      className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="Enter your password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <div className="text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>

              {/* Demo Accounts Section */}
              <div className="mt-8">
            

                {/* <div className="mt-6">
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-white mb-3 text-center">
                      Demo Accounts:
                    </p>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400 font-medium">
                          Admin:
                        </span>
                        <span>admin@customcatalog.com / admin123</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400 font-medium">
                          Test User:
                        </span>
                        <span>test@example.com (Register first)</span>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
