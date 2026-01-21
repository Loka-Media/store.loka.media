"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import GradientTitle from "@/components/ui/GradientTitle";
import { GradientText } from "@/components/ui/GradientText";
import StartShape from "@/components/ui/StartShape";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validators/auth";
import { extractErrorMessage, requiresEmailVerification } from "@/lib/utils/error-handler";

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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        const returnUrl = searchParams.get("returnUrl") || "/dashboard";
        router.push(returnUrl);
      }
    } catch (error: unknown) {
      if (requiresEmailVerification(error)) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="w-full lg:flex-1 relative overflow-hidden bg-background lg:border-r-4 border-white/10">
        <div className="relative z-10 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-16 py-6 sm:py-8 lg:py-0 mt-16 lg:mt-16">
          <div className="max-w-lg">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <GradientTitle text="Sign In to Your Creative Hub" size="lg" />
            </div>

            <GradientText className="text-xs sm:text-sm lg:text-lg mb-6 sm:mb-8 lg:mb-12">
              Join trendsetting artists, brands and creators to showcase your
              unique products and services.
            </GradientText>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-12">
              <div className="text-center flex flex-col items-center">
                <StartShape className="max-w-[80px] sm:max-w-[100px]">
                  <div className="flex justify-center">
                    <svg width="32" height="32" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3666 6.67965C36.1416 6.63815 36.8915 6.75533 37.6166 7.03121C47.9913 10.8358 58.3506 14.6797 68.6947 18.5625C70.6885 20.4904 70.7353 22.4592 68.8353 24.4687C68.4059 24.7772 67.937 25.0117 67.4291 25.1718C57.7151 28.7067 48.012 32.2692 38.3197 35.8593C37.0378 36.5106 35.7253 36.6042 34.3822 36.1406C24.304 32.4375 14.226 28.7343 4.14784 25.0312C1.95693 23.946 1.27725 22.235 2.10878 19.8984C2.40613 19.2729 2.85144 18.7807 3.44472 18.4218C14.076 14.4333 24.7166 10.5193 35.3666 6.67965Z" fill="url(#paint0_linear_1167_938)"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.42797 32.2735C5.34348 32.213 6.2341 32.3302 7.09984 32.6251C16.7092 36.1642 26.3186 39.7031 35.928 43.2422C45.8616 39.5951 55.7991 35.9624 65.7405 32.3438C68.351 32.095 69.8509 33.2669 70.2405 35.8594C70.1392 37.5178 69.3423 38.6898 67.8498 39.3751C57.9953 42.9568 48.1515 46.5662 38.3186 50.2032C36.8831 50.9631 35.43 51.0099 33.9592 50.3438C23.7766 46.6215 13.6046 42.8714 3.44359 39.0938C1.59437 37.677 1.19594 35.9192 2.24828 33.8204C2.82867 33.0753 3.55524 32.5597 4.42797 32.2735Z" fill="url(#paint1_linear_1167_938)"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.42797 46.6172C5.34348 46.5568 6.2341 46.6739 7.09984 46.9688C16.7038 50.5217 26.3132 54.0608 35.928 57.586C45.86 53.9393 55.7976 50.3065 65.7405 46.6876C68.3415 46.442 69.8415 47.6139 70.2405 50.2032C70.1392 51.8616 69.3423 53.0335 67.8498 53.7188C57.631 57.4689 47.4124 61.2188 37.1936 64.9688C35.9291 65.2863 34.7103 65.1457 33.5373 64.5469C23.5061 60.8439 13.4748 57.1406 3.44359 53.4376C1.59437 52.0208 1.19594 50.2629 2.24828 48.1641C2.82867 47.4191 3.55524 46.9034 4.42797 46.6172Z" fill="url(#paint2_linear_1167_938)"/>
                      <defs>
                        <linearGradient id="paint0_linear_1167_938" x1="35.9958" y1="6.67151" x2="35.9958" y2="36.4299" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FB1FFF"/>
                          <stop offset="1" stopColor="#500851"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1167_938" x1="35.9581" y1="32.2581" x2="35.9581" y2="50.8106" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FB1FFF"/>
                          <stop offset="1" stopColor="#500851"/>
                        </linearGradient>
                        <linearGradient id="paint2_linear_1167_938" x1="35.9581" y1="46.6018" x2="35.9581" y2="65.1339" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FB1FFF"/>
                          <stop offset="1" stopColor="#500851"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </StartShape>
                <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">7+</div>
                <div className="text-xs text-white">Platforms</div>
              </div>
              <div className="text-center flex flex-col items-center">
                <StartShape className="max-w-[80px] sm:max-w-[100px]">
                  <div className="flex justify-center">
                    <svg width="32" height="32" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.7898 8.78906C37.3107 8.85286 38.7638 9.20443 40.1492 9.84375C46.4003 12.6177 52.6346 15.4302 58.8523 18.2812C59.4261 18.6615 59.9418 19.1069 60.3992 19.6172C57.0452 21.1769 53.6702 22.7002 50.2742 24.1875C49.993 24.2813 49.7117 24.2813 49.4305 24.1875C41.4276 20.4321 33.4353 16.6587 25.4539 12.8672C25.3708 12.7289 25.4178 12.6351 25.5945 12.5859C27.9534 11.5119 30.3206 10.4573 32.6961 9.42188C33.7201 9.07322 34.7515 8.86229 35.7898 8.78906Z" fill="url(#paint0_linear_1167_952)"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M19.7586 15.1172C28.0591 18.8689 36.3092 22.7361 44.5086 26.7188C42.4158 27.6948 40.3064 28.6324 38.1805 29.5312C36.8794 29.9256 35.5669 29.9724 34.243 29.6719C26.6797 26.4646 19.1563 23.16 11.6726 19.7578C11.4958 19.7086 11.4489 19.6148 11.532 19.4766C12.0113 19.0613 12.5035 18.6628 13.0086 18.2812C15.267 17.21 17.517 16.1553 19.7586 15.1172Z" fill="url(#paint1_linear_1167_952)"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.21094 23.5547C16.6296 26.7704 24.0358 30.0281 31.4297 33.3281C32.1628 33.6118 32.9127 33.8227 33.6797 33.9609C33.7032 43.5704 33.6797 53.1797 33.6094 62.7891C26.7195 59.7779 19.8522 56.7075 13.0078 53.5781C10.8308 52.1017 9.49486 50.0626 9 47.4609C8.90625 39.7734 8.90625 32.086 9 24.3984C9.04434 24.1051 9.11466 23.8238 9.21094 23.5547Z" fill="url(#paint2_linear_1167_952)"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M62.2276 23.5546C62.4135 23.5307 62.5776 23.5776 62.7197 23.6953C62.7666 23.9297 62.8135 24.164 62.8604 24.3984C62.9542 32.0859 62.9542 39.7733 62.8604 47.4609C62.3655 50.0626 61.0296 52.1017 58.8526 53.5781C52.0082 56.7074 45.1409 59.7778 38.251 62.789C38.1807 53.1797 38.1572 43.5704 38.1807 33.9609C38.9477 33.8227 39.6976 33.6117 40.4307 33.3281C42.7686 32.2598 45.1122 31.2051 47.4619 30.164C47.5391 32.2344 47.6563 34.2968 47.8135 36.3515C48.6589 37.8549 49.8074 38.1362 51.2588 37.1953C51.5572 36.9209 51.7682 36.5927 51.8916 36.2109C51.9384 33.539 51.9854 30.8671 52.0322 28.1953C55.4496 26.6619 58.8481 25.115 62.2276 23.5546Z" fill="url(#paint3_linear_1167_952)"/>
                      <defs>
                        <linearGradient id="paint0_linear_1167_952" x1="42.9066" y1="8.78906" x2="42.9066" y2="24.2578" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1167_952" x1="28.0004" y1="15.1172" x2="28.0004" y2="29.8669" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                        <linearGradient id="paint2_linear_1167_952" x1="21.3091" y1="23.5547" x2="21.3091" y2="62.7891" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                        <linearGradient id="paint3_linear_1167_952" x1="50.5513" y1="23.5486" x2="50.5513" y2="62.789" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </StartShape>
                <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">40K+</div>
                <div className="text-xs text-white">Products</div>
              </div>
              <div className="text-center flex flex-col items-center">
                <StartShape className="max-w-[80px] sm:max-w-[100px]">
                  <div className="flex justify-center">
                    <svg width="32" height="32" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_1167_946)">
                        <path fillRule="evenodd" clipRule="evenodd" d="M20.7414 -0.0703125C30.8664 -0.0703125 40.9914 -0.0703125 51.1164 -0.0703125C54.3246 1.04643 55.6137 3.29643 54.9836 6.67969C54.6897 7.61905 54.1975 8.43936 53.507 9.14062C51.7257 10.5469 49.9446 11.9531 48.1633 13.3594C40.007 13.4531 31.8508 13.4531 23.6945 13.3594C21.9132 11.9531 20.1321 10.5469 18.3508 9.14062C16.4761 7.09017 16.1714 4.81673 17.4367 2.32031C18.2923 1.15668 19.3939 0.359802 20.7414 -0.0703125Z" fill="url(#paint0_linear_1167_946)"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M48.7258 71.9297C40.4289 71.9297 32.132 71.9297 23.8352 71.9297C18.0438 71.084 13.8485 68.0372 11.2492 62.7891C9.22985 58.2638 8.47986 53.5294 8.99921 48.586C10.4508 36.8023 15.2087 26.607 23.2727 18C31.7102 17.9062 40.1477 17.9062 48.5852 18C56.6492 26.607 61.4071 36.8023 62.8586 48.586C63.3609 53.4887 62.7046 58.223 60.8898 62.7891C58.452 68.0026 54.3972 71.0494 48.7258 71.9297ZM35.3664 30.0235C37.0104 29.8951 37.9245 30.645 38.1086 32.2735C38.1788 33.022 38.2022 33.772 38.1789 34.5235C39.3985 34.5001 40.6173 34.5235 41.8352 34.5938C43.3777 35.3776 43.7292 36.5261 42.8898 38.0391C42.5206 38.4231 42.0752 38.6809 41.5539 38.8125C39.1164 38.8594 36.6789 38.9063 34.2414 38.9532C32.8616 39.5761 32.51 40.584 33.1867 41.9766C33.4301 42.2743 33.7349 42.4852 34.1008 42.6094C35.511 42.6498 36.9172 42.7436 38.3195 42.8907C41.7184 43.9009 43.3825 46.1744 43.3117 49.711C42.8318 52.6986 41.1208 54.5267 38.1789 55.1953C38.2157 56.281 38.1454 57.3591 37.968 58.4297C37.3197 59.7087 36.3118 60.1072 34.9445 59.625C34.1954 59.1559 33.797 58.4761 33.7492 57.586C33.679 56.8374 33.6556 56.0875 33.6789 55.336C32.4593 55.3593 31.2405 55.336 30.0227 55.2657C28.4801 54.4818 28.1286 53.3333 28.968 51.8203C29.3372 51.4363 29.7826 51.1785 30.3039 51.0469C32.7414 51.0001 35.1789 50.9531 37.6164 50.9063C38.9962 50.2833 39.3478 49.2755 38.6711 47.8828C38.4277 47.5851 38.1229 47.3742 37.757 47.25C36.3468 47.2097 34.9406 47.1159 33.5383 46.9688C29.3372 45.5746 27.8139 42.7388 28.968 38.461C29.8809 36.3761 31.4511 35.1104 33.6789 34.6641C33.6421 33.5785 33.7124 32.5003 33.8898 31.4297C34.186 30.7346 34.6782 30.2659 35.3664 30.0235Z" fill="url(#paint1_linear_1167_946)"/>
                      </g>
                      <defs>
                        <linearGradient id="paint0_linear_1167_946" x1="35.9053" y1="-0.0703125" x2="35.9053" y2="13.4297" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1167_946" x1="35.9309" y1="17.9297" x2="35.9309" y2="71.9297" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <clipPath id="clip0_1167_946">
                          <rect width="72" height="72" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </StartShape>
                <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">$1M++</div>
                <div className="text-xs text-white">Revenue</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {[
                "Design and sell custom products",
                "Connect with your audience",
                "Start earning today",
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 sm:mr-3"></div>
                  <GradientText className="text-xs sm:text-sm lg:text-base">{feature}</GradientText>
                </div>
              ))}
            </div>

            {/* Terms and Privacy */}
            <p className="text-xs sm:text-sm text-white">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="font-bold text-white underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="font-bold text-white underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-6 px-3 sm:py-8 sm:px-6 lg:py-12 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">
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
                <GradientTitle text="Welcome Back!" size="sm" />
                <GradientText className="text-xs sm:text-sm mt-2 sm:mt-3 lg:mt-4">
                  Access your account
                </GradientText>
              </div>

              <form className="space-y-3 sm:space-y-4 lg:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Email Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="block w-full pl-10 pr-3 py-2 sm:py-3 bg-transparent border border-white/20 rounded-lg sm:rounded-xl text-xs sm:text-sm placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-10 py-2 sm:py-3 bg-transparent border border-white/20 rounded-lg sm:rounded-xl text-xs sm:text-sm placeholder-white/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs sm:text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <div className="pt-2 sm:pt-3 lg:pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="primary"
                    className="w-full flex justify-center py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>

                {/* Footer Links */}
                <div className="mt-6 sm:mt-8 lg:mt-10 pt-4 sm:pt-6 lg:pt-8 border-t border-white/10">
                  <p className="text-xs text-white/60 text-center leading-relaxed mb-4">
                    New to our platform?
                  </p>
                  <div className="space-y-2.5">
                    {/* Customer Signup Button */}
                    <Button
                      href="/auth/signup/customer"
                      variant="secondary"
                      className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 hover:border-green-400/60 hover:from-green-900/30 hover:to-emerald-900/30 !rounded-lg sm:!rounded-xl !text-left !px-3 sm:!px-3.5 !py-3 sm:!py-3.5"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex-shrink-0">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Shop Amazing Products</p>
                          <p className="text-xs text-white/60">Browse & buy from creators</p>
                        </div>
                      </div>
                      <div className="text-green-400 flex-shrink-0">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>

                    {/* Creator Signup Button */}
                    <Button
                      href="/auth/signup/creator"
                      variant="secondary"
                      className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 hover:border-orange-400/60 hover:from-orange-900/30 hover:to-red-900/30 !rounded-lg sm:!rounded-xl !text-left !px-3 sm:!px-3.5 !py-3 sm:!py-3.5"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex-shrink-0">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Start Selling Now</p>
                          <p className="text-xs text-white/60">Earn by creating & selling</p>
                        </div>
                      </div>
                      <div className="text-orange-400 flex-shrink-0">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

LoginPageContent.displayName = "LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-white/20 border-t-white"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
