// pages/auth/register.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // Corrected path to AuthContext
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  UserCheck,
  Store,
  ArrowRight, // Added for the CTA button on the left
  Users, // Added for stats on the left
  ShoppingBag, // Added for stats on the left
  TrendingUp, // Added for stats on the left
} from "lucide-react";

// Import the LottieAnimation component (ensure this path is correct and component is defined as discussed)
import LottieAnimation from "@/components/LottieAnimation";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["user", "creator"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "user",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const success = await registerUser(data);
      if (success) {
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(data.email)}`
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      // TODO: Implement user-friendly error display (e.g., toast notification)
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main container now uses the same flex properties as the login page
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      {/* --- Left Side - Hero Section (Copied directly from Login Page) --- */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent"></div>

        {/* Lottie Animation (ensure '/fly-man.json' exists in your public folder) */}
        <div className="absolute inset-0">
          <LottieAnimation
            animationPath="/fly-man.json" // Using the same Lottie as the login page
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
            className="opacity-30" // Subtle background effect
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16 text-white">

          {/* Hero Content - Updated Messaging */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6">
              Empowering{" "}
              <span className="block text-orange-400">
                Creators, Artists & Brands
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of influencers, artists, and businesses to showcase
              your unique products and services, connecting directly with your
              audience.
            </p>

            {/* Stats Section - Updated Icons/Text for broader audience */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400">Active Members</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm text-gray-400">Products & Services</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white">₹2Cr+</div>
                <div className="text-sm text-gray-400">Total Earnings</div>
              </div>
            </div>

            {/* Feature Highlights - Updated Messaging */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Zero listing fees for all members</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Direct audience and customer connections</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Curated tools for growth and visibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- End Left Side --- */}

      {/* --- Right Side - Registration Form (Your existing form content) --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        {" "}
        {/* Adjusted width here */}
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">
          {" "}
          {/* Adjusted max-width here for more space */}
          {/* Mobile Logo (visible only on smaller screens where the left side is hidden) */}
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
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-base text-gray-300">
              Or{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-orange-400 hover:text-orange-300 transition-colors duration-300"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>
          {/* Form */}
          <div className="mt-8">
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/50 py-8 px-6 lg:px-8 shadow-xl rounded-xl">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Account Type
                  </label>
                  <p className="text-xs sm:text-sm leading-5 text-gray-400 mt-1">
                    Choose your account type
                  </p>
                  <fieldset className="mt-3 sm:mt-4">
                    <legend className="sr-only">Account type</legend>
                    <div className="space-y-2 sm:space-y-3">
                      {/* User Role Option */}
                      <div className="flex items-center">
                        <input
                          {...register("role")}
                          value="user"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <label className="ml-3 block text-xs sm:text-sm font-medium text-gray-300">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span>
                              <span className="text-white font-semibold">
                                User
                              </span>
                              <span className="block sm:inline sm:ml-1 text-gray-400">
                                - Browse and purchase products
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      {/* Creator Role Option */}
                      <div className="flex items-center">
                        <input
                          {...register("role")}
                          value="creator"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <label className="ml-3 block text-xs sm:text-sm font-medium text-gray-300">
                          <span className="flex items-center">
                            <UserCheck className="w-4 h-4 mr-2" />
                            <span>
                              <span className="text-white font-semibold">
                                Creator
                              </span>
                              <span className="block sm:inline sm:ml-1 text-gray-400">
                                - Sell your products
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Name Field */}
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="name"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("name")}
                        type="text"
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Username Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="username"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("username")}
                        type="text"
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Choose a username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="phone"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="email"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("email")}
                        type="email"
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="password"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        className="block w-full pl-8 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Create a password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.password && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs sm:text-sm font-semibold text-white mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        className="block w-full pl-8 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg placeholder-gray-400 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        placeholder="Confirm your password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-300"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 sm:pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-orange-400 hover:text-orange-300 transition-colors duration-300"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-orange-400 hover:text-orange-300 transition-colors duration-300"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- End Right Side --- */}
    </div>
  );
}

RegisterPageContent.displayName = "RegisterPageContent";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="text-white ml-4 text-xl">
            Loading registration form...
          </p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
