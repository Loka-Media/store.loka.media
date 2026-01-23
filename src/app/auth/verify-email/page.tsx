'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { authAPI } from '@/lib/auth';
import { Mail, ArrowLeft, Sparkles, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyEmailSchema, VerifyEmailFormData } from '@/lib/validators/auth';
import { extractErrorMessage } from '@/lib/utils/error-handler';

function VerifyEmailPageContent() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const otpValue = watch('otp');

  useEffect(() => {
    if (!email) {
      router.push('/auth/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    if (!email) return;

    setLoading(true);
    try {
      await authAPI.verifyEmail(email, data.otp);
      toast.success('Email verified successfully!');
      router.push('/auth/login');
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || resendCooldown > 0) return;

    setResendLoading(true);
    try {
      await authAPI.resendOTP(email);
      toast.success('OTP sent successfully!');
      setResendCooldown(60);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to resend OTP'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="w-full lg:flex-1 relative overflow-hidden bg-background lg:border-r-4 border-white/10">
        <div className="relative z-10 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-16 py-6 sm:py-8 lg:py-0 mt-16 lg:mt-16">
          <div className="max-w-lg">
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                Verify Your Email
              </h1>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8 lg:mb-12 leading-relaxed font-medium">
              We've sent a 6-digit verification code to your email. Enter it below to complete your registration!
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 sm:space-y-3 mb-8">
              {[
                "Secure email verification",
                "One-time verification code",
                "Access your account instantly",
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
                  <Sparkles className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">Quick Verification</div>
                  <div className="text-xs text-white/60 font-medium">Just one more step to get started!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Verification Form */}
      <div className="flex-1 flex flex-col justify-center py-6 px-3 sm:py-8 sm:px-6 lg:py-12 lg:px-8 lg:flex-none lg:w-[680px] xl:w-[820px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-3xl">
          {/* Back Link */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center font-bold text-orange-500 hover:text-orange-600 transition-colors text-xs sm:text-sm underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

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
                  Verify Email
                </h2>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 font-medium">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">{email}</p>
              </div>

              <form className="space-y-4 sm:space-y-5 lg:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* OTP Field */}
                <div>
                  <label htmlFor="otp" className="block text-xs sm:text-sm font-semibold text-white mb-2">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('otp')}
                      onChange={handleOTPChange}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="block w-full px-3 py-3 sm:py-4 bg-transparent border border-white/20 rounded-lg sm:rounded-xl placeholder-white/40 text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-xl sm:text-2xl tracking-widest transition-all"
                      placeholder="000000"
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-xs text-red-400 font-medium">
                      {errors.otp.message}
                    </p>
                  )}
                </div>

                {/* Timer Info */}
                <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="text-xs sm:text-sm font-medium text-white/80">
                      Code expires in 10 minutes
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 sm:pt-3 lg:pt-4">
                  <button
                    type="submit"
                    disabled={loading || !otpValue || otpValue.length !== 6}
                    className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify Email'
                    )}
                  </button>
                </div>
              </form>

              {/* Resend Section */}
              <div className="mt-6 sm:mt-8 lg:mt-10 pt-4 sm:pt-6 lg:pt-8 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/60 mb-4 font-medium">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading || resendCooldown > 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg sm:rounded-xl font-semibold text-white text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                    {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-white/20 border-t-white"></div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
