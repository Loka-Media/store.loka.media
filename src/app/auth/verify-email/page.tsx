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
    <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex min-h-screen">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-yellow-200 via-pink-100 to-purple-100 border-r-4 border-black">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-pink-300 rounded-full opacity-40 border-4 border-black"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-300 rounded-3xl opacity-30 rotate-12 border-4 border-black"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-purple-300 rounded-2xl opacity-20 -rotate-12 border-4 border-black"></div>

        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16">
          {/* Hero Content */}
          <div className="max-w-lg">
            <div className="inline-block bg-pink-300 border-4 border-black px-4 py-2 rounded-xl mb-6 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-black" />
                <span className="text-sm font-extrabold text-black">ALMOST THERE!</span>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black">
              Verify Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Email Address
              </span>
            </h1>

            <p className="text-xl text-black font-bold mb-8 leading-relaxed">
              We've sent a 6-digit verification code to your email. Enter it below to complete your registration!
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3">
              {[
                "Secure email verification",
                "One-time verification code",
                "Access your account instantly",
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-black">
                  <div className="w-3 h-3 bg-black rounded-full mr-3 border-2 border-black"></div>
                  <span className="font-bold">{feature}</span>
                </div>
              ))}
            </div>

            {/* Info Card */}
            <div className="mt-8 bg-yellow-200 border-4 border-black rounded-2xl p-4 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-xl">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="font-extrabold text-black">Quick Verification</div>
                  <div className="text-sm font-bold text-black">Just one more step to get started!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Verification Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 lg:flex-none lg:w-[600px] xl:w-[700px]">
        <div className="mx-auto w-full max-w-sm lg:max-w-xl">

          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center font-extrabold text-purple-600 hover:text-purple-700 transition-colors underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-block bg-pink-300 border-4 border-black px-4 py-2 rounded-xl mb-4">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black tracking-tight">
                Verify Email
              </h2>
            </div>
            <p className="mt-3 text-base font-bold text-black">
              We've sent a 6-digit code to
            </p>
            <p className="text-base font-extrabold text-purple-600">{email}</p>
          </div>

          {/* Form */}
          <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* OTP Field */}
              <div>
                <label htmlFor="otp" className="block text-sm font-extrabold text-black mb-2">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    {...register('otp')}
                    onChange={handleOTPChange}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="block w-full px-3 py-3 bg-white border-2 border-black rounded-xl placeholder-gray-500 text-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
                {errors.otp && (
                  <p className="mt-2 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-1">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* Timer Info */}
              <div className="bg-yellow-100 border-2 border-black rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  <span className="text-sm font-bold text-black">
                    Code expires in 10 minutes
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !otpValue || otpValue.length !== 6}
                  className="w-full flex justify-center py-3 px-4 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
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
            <div className="mt-6 pt-6 border-t-2 border-black">
              <div className="text-center">
                <p className="text-sm font-bold text-black mb-3">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || resendCooldown > 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-200 hover:bg-pink-300 border-2 border-black rounded-xl font-extrabold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
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
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-black border-t-transparent"></div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
