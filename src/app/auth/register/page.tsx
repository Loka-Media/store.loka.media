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
  Users, // Added for stats on the left
  ShoppingBag, // Added for stats on the left
  TrendingUp, // Added for stats on the left
  Link as LinkIcon,
  AlertCircle,
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
    creatorUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.role === "creator" && (!data.creatorUrl || data.creatorUrl.trim() === "")) {
      return false;
    }
    return true;
  }, {
    message: "Creator URL is required for creator accounts",
    path: ["creatorUrl"],
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "user",
    },
  });

  const selectedRole = watch("role");

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- Left Side - Hero Section (Copied directly from Login Page) --- */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-white border-r border-gray-200">
        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">

          {/* Hero Content - Updated Messaging */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6 text-gray-900">
              CREATE YOUR{" "}
              <span className="block text-accent">
                ACCOUNT PAGE
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join trendsetting artists, brands and creators to showcase your unique products and services, connecting directly with your audience.
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
                <span>Creators - Design and sell your custom products</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- End Left Side --- */}

      {/* --- Right Side - Registration Form (Your existing form content) --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Or{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>
          {/* Form */}
          <div className="mt-8">
            <div className="bg-white border border-gray-200 py-8 px-6 lg:px-8 shadow-sm rounded-xl">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Role Selection - Cool Toggle Switch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Account Type
                  </label>
                  <p className="text-xs sm:text-sm leading-5 text-gray-600 mt-1">
                    Toggle to switch between User and Creator account
                  </p>

                  <div className="mt-4 flex items-center justify-start">
                    <div className="w-1/2 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {/* User Side */}
                      <div className={`flex items-center transition-all duration-300 ${selectedRole === 'user' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <User className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-semibold text-xs">User</div>
                          <div className="text-xs text-gray-500">Browse</div>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="relative mx-4">
                        <div
                          className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                            selectedRole === 'creator'
                              ? 'bg-accent'
                              : 'bg-gray-300'
                          }`}
                          onClick={() => {
                            const newRole = selectedRole === 'creator' ? 'user' : 'creator';
                            setValue('role', newRole);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              const newRole = selectedRole === 'creator' ? 'user' : 'creator';
                              setValue('role', newRole);
                            }
                          }}
                          tabIndex={0}
                          role="switch"
                          aria-checked={selectedRole === 'creator'}
                          aria-label="Toggle between User and Creator account type"
                        >
                          {/* Switch Ball */}
                          <div
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ease-in-out transform ${
                              selectedRole === 'creator' ? 'translate-x-8' : 'translate-x-1'
                            }`}
                          >
                            {/* Icon inside the ball */}
                            <div className="flex items-center justify-center w-full h-full">
                              {selectedRole === 'creator' ? (
                                <UserCheck className="w-3 h-3 text-accent" />
                              ) : (
                                <User className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Creator Side */}
                      <div className={`flex items-center transition-all duration-300 ${selectedRole === 'creator' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <div className="text-right mr-2">
                          <div className="font-semibold text-xs">Creator</div>
                          <div className="text-xs text-gray-500">Sell</div>
                        </div>
                        <UserCheck className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creator URL Field - Conditionally shown */}
                {selectedRole === "creator" && (
                  <div>
                    <label
                      htmlFor="creatorUrl"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
                    >
                      Creator Handle/Profile URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        {...register("creatorUrl")}
                        type="url"
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="https://instagram.com/yourhandle or YouTube/TikTok URL"
                      />
                    </div>
                    {errors.creatorUrl && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.creatorUrl.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Creator Approval Notice */}
                {selectedRole === "creator" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Creator Account Approval Required
                        </h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          You will initially register as a user. Your creator request will be reviewed by our admin team.
                          Once approved, you&apos;ll gain access to creator features including product uploads and sales tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Name Field */}
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="name"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Username Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="username"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Choose a username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="phone"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="email"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="password"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Create a password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="lg:col-span-1">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2"
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
                        className="block w-full pl-8 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Confirm your password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
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
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm sm:text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-accent hover:text-accent/80 transition-colors"
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
          <p className="text-gray-900 ml-4 text-xl">
            Loading registration form...
          </p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
