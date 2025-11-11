// pages/auth/register.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  UserCheck,
  Users,
  ShoppingBag,
  TrendingUp,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";

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
  .refine(
    (data) => {
      if (data.role === "creator" && (!data.creatorUrl || data.creatorUrl.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Creator URL is required for creator accounts",
      path: ["creatorUrl"],
    }
  );

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
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 border-r-4 border-black">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-green-300 rounded-full opacity-40 border-4 border-black"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-yellow-300 rounded-3xl opacity-30 -rotate-12 border-4 border-black"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-pink-300 rounded-2xl opacity-20 rotate-12 border-4 border-black"></div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">
          <div className="max-w-lg">
            <div className="inline-block bg-green-300 border-4 border-black px-4 py-2 rounded-xl mb-6 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-black" />
                <span className="text-sm font-extrabold text-black">JOIN US NOW!</span>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black">
              Create Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Account Today
              </span>
            </h1>

            <p className="text-xl text-black font-bold mb-8 leading-relaxed">
              Join trendsetting artists, brands and creators to showcase your unique products and services.
            </p>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">7+</div>
                <div className="text-xs font-bold text-black">Platforms</div>
              </div>
              <div className="bg-yellow-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">40K+</div>
                <div className="text-xs font-bold text-black">Products</div>
              </div>
              <div className="bg-pink-200 border-4 border-black rounded-2xl p-4 text-center hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-2 mx-auto">
                  <TrendingUp className="w-6 h-6 text-pink-300" />
                </div>
                <div className="text-2xl font-extrabold text-black">$1M++</div>
                <div className="text-xs font-bold text-black">Revenue</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              {[
                "Design and sell custom products",
                "Connect with your audience",
                "Start earning today",
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

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-block bg-yellow-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                Sign Up
              </h2>
            </div>
            <p className="mt-3 text-base font-bold text-black">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Role Selection - Toggle Switch */}
              <div>
                <label className="block text-sm font-extrabold text-black mb-2">Account Type</label>
                <p className="text-xs text-black font-bold mb-3">Choose your account type</p>

                <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-100 to-pink-100 rounded-xl border-4 border-black">
                  <div className="flex items-center gap-6">
                    {/* User Side */}
                    <div
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        selectedRole === "user" ? "text-black" : "text-gray-400"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <div>
                        <div className="font-extrabold text-sm">User</div>
                        <div className="text-xs font-bold">Browse</div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="relative">
                      <div
                        className={`relative w-20 h-10 rounded-full transition-all duration-300 ease-in-out cursor-pointer border-4 border-black ${
                          selectedRole === "creator" ? "bg-green-400" : "bg-gray-300"
                        }`}
                        onClick={() => {
                          const newRole = selectedRole === "creator" ? "user" : "creator";
                          setValue("role", newRole);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            const newRole = selectedRole === "creator" ? "user" : "creator";
                            setValue("role", newRole);
                          }
                        }}
                        tabIndex={0}
                        role="switch"
                        aria-checked={selectedRole === "creator"}
                        aria-label="Toggle between User and Creator account type"
                      >
                        <div
                          className={`absolute top-1 w-7 h-7 bg-white rounded-full border-2 border-black shadow-lg transition-all duration-300 ease-in-out transform ${
                            selectedRole === "creator" ? "translate-x-10" : "translate-x-1"
                          }`}
                        >
                          <div className="flex items-center justify-center w-full h-full">
                            {selectedRole === "creator" ? (
                              <UserCheck className="w-4 h-4 text-green-600" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Creator Side */}
                    <div
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        selectedRole === "creator" ? "text-black" : "text-gray-400"
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-sm">Creator</div>
                        <div className="text-xs font-bold">Sell</div>
                      </div>
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator URL Field */}
              {selectedRole === "creator" && (
                <div>
                  <label htmlFor="creatorUrl" className="block text-sm font-extrabold text-black mb-2">
                    Creator Handle/Profile URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("creatorUrl")}
                      type="url"
                      className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-black transition-all"
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  {errors.creatorUrl && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.creatorUrl.message}
                    </p>
                  )}
                </div>
              )}

              {/* Creator Approval Notice */}
              {selectedRole === "creator" && (
                <div className="bg-blue-100 border-4 border-blue-600 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-extrabold text-blue-900 mb-1">
                        Creator Account Approval Required
                      </h4>
                      <p className="text-xs text-blue-800 font-bold leading-relaxed">
                        Your creator request will be reviewed by our admin team. Once approved, you'll gain access to creator features.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="lg:col-span-2">
                  <label htmlFor="name" className="block text-sm font-extrabold text-black mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("name")}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-extrabold text-black mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("username")}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-extrabold text-black mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("phone")}
                      type="tel"
                      className="block w-full pl-10 pr-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="lg:col-span-2">
                  <label htmlFor="email" className="block text-sm font-extrabold text-black mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
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
                  <label htmlFor="password" className="block text-sm font-extrabold text-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                      placeholder="Create a password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-black hover:text-gray-700 focus:outline-none transition-colors p-1"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-extrabold text-black mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-black" />
                    </div>
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="block w-full pl-10 pr-10 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black transition-all"
                      placeholder="Confirm your password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-black hover:text-gray-700 focus:outline-none transition-colors p-1"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t-4 border-black">
              <p className="text-xs text-black font-bold text-center leading-relaxed">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-purple-600 hover:text-purple-700 transition-colors underline font-extrabold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-700 transition-colors underline font-extrabold">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

RegisterPageContent.displayName = "RegisterPageContent";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-black border-t-transparent"></div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
