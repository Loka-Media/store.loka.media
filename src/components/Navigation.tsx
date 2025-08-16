"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import {
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Store,
  Heart,
  MapPin,
  User,
} from "lucide-react";
import Image from "next/image";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useGuestCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <span className="ml-3 text-2xl font-black text-white tracking-tight">
                <Image
                  src="/loka-logo/loka-main-white.png"
                  alt="Logo"
                  width={400}
                  height={200}
                  className="h-auto w-28 text-white"
                />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              <Link
                href="/products"
                className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
              >
                Marketplace
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === "creator" && (
                    <Link
                      href="/dashboard/creator"
                      className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                    >
                      Creator Hub
                    </Link>
                  )}

                  {user?.role === "admin" && (
                    <Link
                      href="/dashboard/admin"
                      className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user?.role === "user" && (
                    <>
                      <Link
                        href="/wishlist"
                        className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </Link>
                      <Link
                        href="/addresses"
                        className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Addresses
                      </Link>
                      <Link
                        href="/cart"
                        className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center relative"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Cart
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>

                  <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium hidden lg:block">
                        {user?.name || user?.email}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/cart"
                    className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center relative"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Cart
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 transition-all duration-300"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-3 space-y-1 bg-black/95 backdrop-blur-md border-t border-gray-800/50">
            <Link
              href="/products"
              className="text-gray-300 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === "creator" && (
                  <Link
                    href="/dashboard/creator"
                    className="text-gray-300 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Creator Hub
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-300 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {user?.role === "user" && (
                  <>
                    <Link
                      href="/wishlist"
                      className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 mr-3" />
                      Wishlist
                    </Link>
                    <Link
                      href="/addresses"
                      className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MapPin className="w-5 h-5 mr-3" />
                      Addresses
                    </Link>
                    <Link
                      href="/cart"
                      className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 mr-3" />
                      Cart
                      {cartCount > 0 && (
                        <span className="ml-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>

                <div className="border-t border-gray-800 mt-4 pt-4">
                  <div className="flex items-center px-4 py-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold w-full text-left transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/cart"
                  className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white hover:bg-white/10 block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white block px-4 py-3 rounded-lg text-base font-bold transition-all duration-300 mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
