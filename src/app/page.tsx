"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  Users,
  UserCheck,
  Shield,
  Store,
  ShoppingBag,
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 h-full w-full" aria-hidden="true">
          <div className="relative h-full">
            <svg
              className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-1/4"
              width={404}
              height={784}
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
                  x={0}
                  y={0}
                  width={20}
                  height={20}
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x={0}
                    y={0}
                    width={4}
                    height={4}
                    className="text-gray-200"
                    fill="currentColor"
                  />
                </pattern>
              </defs>
              <rect
                width={404}
                height={784}
                fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)"
              />
            </svg>
          </div>
        </div>

        <div className="relative pt-6 pb-16 sm:pb-24">
          <main className="mt-16 sm:mt-24">
            <div className="mx-auto max-w-7xl">
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="px-4 sm:px-6 sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                  <div>
                    <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:mt-5 sm:leading-none lg:mt-6 lg:text-5xl xl:text-6xl">
                      <span className="md:block">Custom Catalog</span>{" "}
                      <span className="text-indigo-600 md:block">Platform</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      Connect creators with customers. Build your marketplace,
                      showcase products, and grow your business with our
                      comprehensive platform.
                    </p>
                    <div className="mt-10 space-y-4 sm:space-y-0 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <Link
                          href="/products"
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                        >
                          <ShoppingBag className="mr-2 w-5 h-5" />
                          Browse Marketplace
                        </Link>
                      </div>

                      {!isAuthenticated ? (
                        <>
                          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                              href="/auth/register"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                              Get Started
                              <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                          </div>
                          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                              href="/auth/login"
                              className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                              Sign In
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                          <Link
                            href={
                              user?.role === "creator"
                                ? "/dashboard/creator"
                                : "/dashboard"
                            }
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                          >
                            <Store className="mr-2 w-5 h-5" />
                            {user?.role === "creator"
                              ? "Creator Dashboard"
                              : "My Dashboard"}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {!user && (
                  <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
                    <div className="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                      <div className="px-4 py-8 sm:px-10">
                        <div>
                          <p className="text-sm font-medium text-gray-700 text-center">
                            Choose your account type
                          </p>
                          <div className="mt-6 grid grid-cols-1 gap-3">
                            <Link
                              href="/auth/register?role=user"
                              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                              <Users className="w-5 h-5 mr-2 text-blue-500" />
                              <span>Join as User</span>
                            </Link>
                            <Link
                              href="/auth/register?role=creator"
                              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                              <UserCheck className="w-5 h-5 mr-2 text-green-500" />
                              <span>Join as Creator</span>
                            </Link>
                          </div>
                        </div>
                        <div className="mt-6">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">
                                Demo Access
                              </span>
                            </div>
                          </div>
                          <div className="mt-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <Shield className="w-4 h-4 mr-1 text-red-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  Admin Login
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                admin@customcatalog.com
                              </p>
                              <p className="text-xs text-gray-500">
                                Password: admin123
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    Multi-Role Support
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Support for users, creators, and admins with role-based
                    access control.
                  </dd>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    Secure Authentication
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    JWT-based authentication with refresh tokens and email
                    verification.
                  </dd>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    Creator Tools
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Comprehensive tools for creators to manage their products
                    and sales.
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
