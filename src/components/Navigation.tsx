"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
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
  const { wishlistCount } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-200 via-pink-100 to-yellow-200 border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Neubrutalism style: bold, colorful */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-extrabold text-black tracking-tighter bg-white px-4 py-2 rounded-lg border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                Loka Media
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Gumroad style: minimal, clean */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              <Link
                href="/products"
                className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors"
              >
                Marketplace
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === "creator" && (
                    <Link
                      href="/dashboard/creator"
                      className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Creator Hub
                    </Link>
                  )}

                  {user?.role === "admin" && (
                    <Link
                      href="/dashboard/admin"
                      className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user?.role === "user" && (
                    <>
                      <Link
                        href="/wishlist"
                        className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors flex items-center relative"
                      >
                        <Heart className="w-4 h-4 mr-1.5" />
                        Wishlist
                        {wishlistCount > 0 && (
                          <span className="ml-1.5 bg-pink-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black">
                            {wishlistCount > 99 ? "99+" : wishlistCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/addresses"
                        className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors flex items-center"
                      >
                        <MapPin className="w-4 h-4 mr-1.5" />
                        Addresses
                      </Link>
                      <Link
                        href="/cart"
                        className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors flex items-center relative"
                      >
                        <ShoppingBag className="w-4 h-4 mr-1.5" />
                        Cart
                        {cartCount > 0 && (
                          <span className="ml-1.5 bg-yellow-300 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <Link
                    href="/profile"
                    className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors flex items-center"
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    Profile
                  </Link>

                  <div className="flex items-center space-x-2 ml-3 pl-3 border-l border-gray-200">
                    <span className="text-xs text-black/70 font-semibold hidden lg:block">
                      {user?.name || user?.email}
                    </span>
                    <button
                      onClick={logout}
                      className="text-black/70 hover:text-black px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/cart"
                    className="text-black/70 hover:text-black px-4 py-2 text-sm font-semibold transition-colors flex items-center relative"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    Cart
                    {cartCount > 0 && (
                      <span className="ml-1.5 bg-yellow-300 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-black/70 hover:text-black px-4 py-2 text-sm font-extrabold transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-black hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-extrabold transition-all border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                  >
                    Start selling
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
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
          <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            <Link
              href="/products"
              className="text-gray-700 hover:text-gray-900 block px-4 py-3 text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === "creator" && (
                  <Link
                    href="/dashboard/creator"
                    className="text-gray-700 hover:text-gray-900 block px-4 py-3 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Creator Hub
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-700 hover:text-gray-900 block px-4 py-3 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {user?.role === "user" && (
                  <>
                    <Link
                      href="/wishlist"
                      className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 mr-3" />
                      Wishlist
                    </Link>
                    <Link
                      href="/addresses"
                      className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MapPin className="w-5 h-5 mr-3" />
                      Addresses
                    </Link>
                    <Link
                      href="/cart"
                      className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium transition-colors relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 mr-3" />
                      Cart
                      {cartCount > 0 && (
                        <span className="ml-auto bg-gray-900 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex items-center px-4 py-2 mb-3">
                    <span className="text-sm text-gray-700 font-medium">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium w-full text-left transition-colors"
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
                  className="text-gray-700 hover:text-gray-900 flex items-center px-4 py-3 text-base font-medium transition-colors relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-gray-900 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 block px-4 py-3 text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-accent hover:bg-accent/90 text-white block px-4 py-3 rounded-lg text-base font-medium transition-colors mt-2"
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
