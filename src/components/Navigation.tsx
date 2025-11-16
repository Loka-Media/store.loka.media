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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Bold and clean */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <span className="text-2xl font-extrabold text-black tracking-tight bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 px-5 py-2.5 rounded-xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                Loka Media
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Clean and spacious */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-2">
              {/* Main navigation links */}
              <Link
                href="/products"
                className="text-black px-4 py-2 text-base font-bold hover:bg-yellow-100 rounded-lg transition-all"
              >
                Discover
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === "creator" && (
                    <Link
                      href="/dashboard/creator"
                      className="text-black px-4 py-2 text-base font-bold hover:bg-purple-100 rounded-lg transition-all"
                    >
                      Creator Hub
                    </Link>
                  )}

                  {user?.role === "admin" && (
                    <Link
                      href="/dashboard/admin"
                      className="text-black px-4 py-2 text-base font-bold hover:bg-blue-100 rounded-lg transition-all"
                    >
                      Admin
                    </Link>
                  )}

                  {user?.role === "user" && (
                    <>
                      <Link
                        href="/wishlist"
                        className="text-black px-3 py-2 text-base font-bold hover:bg-pink-100 rounded-lg transition-all flex items-center relative"
                      >
                        <Heart className="w-5 h-5" />
                        {wishlistCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-pink-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            {wishlistCount > 99 ? "99+" : wishlistCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/addresses"
                        className="text-black px-3 py-2 text-base font-bold hover:bg-green-100 rounded-lg transition-all flex items-center"
                      >
                        <MapPin className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/cart"
                        className="text-black px-3 py-2 text-base font-bold hover:bg-yellow-100 rounded-lg transition-all flex items-center relative"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-yellow-300 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  {/* Divider */}
                  <div className="h-8 w-px bg-black/20 mx-2"></div>

                  {/* User section */}
                  <Link
                    href="/profile"
                    className="text-black px-3 py-2 text-base font-bold hover:bg-purple-100 rounded-lg transition-all flex items-center"
                  >
                    <User className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={logout}
                    className="text-black px-4 py-2 text-base font-bold hover:bg-red-100 rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/cart"
                    className="text-black px-3 py-2 text-base font-bold hover:bg-yellow-100 rounded-lg transition-all flex items-center relative"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-300 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Divider */}
                  <div className="h-8 w-px bg-black/20 mx-2"></div>

                  {/* Action buttons */}
                  <Link
                    href="/auth/login"
                    className="text-black px-5 py-2 text-base font-bold hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-black text-white px-6 py-2.5 rounded-xl text-base font-extrabold border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
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
              className="inline-flex items-center justify-center p-2 rounded-lg text-black hover:bg-gray-100 focus:outline-none transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 font-extrabold" />
              ) : (
                <Menu className="h-6 w-6 font-extrabold" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Enhanced with neubrutalism */}
      {isMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-gradient-to-b from-white to-yellow-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <Link
              href="/products"
              className="text-black font-bold block px-4 py-3 rounded-xl hover:bg-yellow-200 border-2 border-transparent hover:border-black transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Discover
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === "creator" && (
                  <Link
                    href="/dashboard/creator"
                    className="text-black font-bold block px-4 py-3 rounded-xl hover:bg-purple-200 border-2 border-transparent hover:border-black transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Creator Hub
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/dashboard/admin"
                    className="text-black font-bold block px-4 py-3 rounded-xl hover:bg-blue-200 border-2 border-transparent hover:border-black transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {user?.role === "user" && (
                  <>
                    <Link
                      href="/wishlist"
                      className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-pink-200 border-2 border-transparent hover:border-black transition-all relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 mr-3" />
                      Wishlist
                      {wishlistCount > 0 && (
                        <span className="ml-auto bg-pink-400 text-black text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold border-2 border-black">
                          {wishlistCount > 99 ? "99+" : wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/addresses"
                      className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-green-200 border-2 border-transparent hover:border-black transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MapPin className="w-5 h-5 mr-3" />
                      Addresses
                    </Link>
                    <Link
                      href="/cart"
                      className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-yellow-200 border-2 border-transparent hover:border-black transition-all relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 mr-3" />
                      Cart
                      {cartCount > 0 && (
                        <span className="ml-auto bg-yellow-300 text-black text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold border-2 border-black">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-purple-200 border-2 border-transparent hover:border-black transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>

                <div className="border-t-4 border-black mt-4 pt-4">
                  <div className="bg-gradient-to-r from-yellow-200 to-pink-200 border-4 border-black rounded-xl px-4 py-3 mb-3">
                    <span className="text-sm text-black font-extrabold">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-red-200 border-2 border-transparent hover:border-black transition-all w-full"
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
                  className="text-black font-bold flex items-center px-4 py-3 rounded-xl hover:bg-yellow-200 border-2 border-transparent hover:border-black transition-all relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-yellow-300 text-black text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold border-2 border-black">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>

                <div className="border-t-4 border-black mt-4 pt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="text-black font-bold block px-4 py-3 rounded-xl hover:bg-gray-200 border-2 border-transparent hover:border-black transition-all text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-black text-white font-extrabold block px-4 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start selling
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
