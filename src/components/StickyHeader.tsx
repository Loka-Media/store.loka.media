"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import {
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Heart,
  User,
} from "lucide-react";
import Image from "next/image";
import GlassSurface from "./GlassSurface";

export default function StickyHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useGuestCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header after scrolling 100px, only hide when very close to top
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`w-3/5 max-w-4xl fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
      isVisible 
        ? 'translate-y-0 opacity-100 scale-100' 
        : '-translate-y-full opacity-0 scale-95'
    }`}>
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={24}
        borderWidth={0.07}
        brightness={50}
        opacity={0.93}
        blur={15}
        displace={2}
        backgroundOpacity={0.15}
        saturation={1.5}
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        xChannel="R"
        yChannel="G"
        mixBlendMode="difference"
        className="rounded-3xl overflow-hidden"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center group">
                <Image
                  src="/loka-logo/loka-main-white.png"
                  alt="Logo"
                  width={300}
                  height={150}
                  className="h-auto w-20 text-white"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-1">
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                >
                  Marketplace
                </Link>

                {isAuthenticated ? (
                  <>
                    {user?.role === "creator" && (
                      <Link
                        href="/dashboard/creator"
                        className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                      >
                        Creator Hub
                      </Link>
                    )}

                    {user?.role === "admin" && (
                      <Link
                        href="/dashboard/admin"
                        className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    {user?.role === "user" && (
                      <>
                        <Link
                          href="/wishlist"
                          className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Wishlist
                        </Link>
                        <Link
                          href="/cart"
                          className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center relative"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Cart
                          {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {cartCount > 99 ? "99+" : cartCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}

                    <Link
                      href="/profile"
                      className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>

                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center ml-2"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/cart"
                      className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center relative"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Cart
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/auth/login"
                      className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300"
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
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent transition-all duration-300"
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
          <div className="md:hidden border-t border-white/10 animate-in slide-in-from-top-2 duration-300 ease-out">
            <div 
              className="px-4 pt-2 pb-3 space-y-1 rounded-b-3xl"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(1.8) brightness(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8) brightness(1.2)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderTop: 'none',
              }}
            >
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
                        href="/cart"
                        className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 relative"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ShoppingBag className="w-5 h-5 mr-3" />
                        Cart
                        {cartCount > 0 && (
                          <span className="ml-auto bg-accent text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
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
                      <span className="ml-auto bg-accent text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
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
                    className="bg-accent hover:bg-accent/90 text-white block px-4 py-3 rounded-lg text-base font-bold transition-all duration-300 mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </GlassSurface>
    </div>
  );
}