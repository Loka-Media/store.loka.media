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
  Heart,
  MapPin,
  User,
} from "lucide-react";
import Image from "next/image";

const StartSellingButton = () => (
  <svg
    width="125"
    height="40"
    viewBox="0 0 125 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <rect width="125" height="40" rx="20" fill="#FF6D1F" />
    <path
      d="M21.296 25.16C18.096 25.16 16.464 23.752 16.464 21.496V21.4H18.192V21.656C18.192 22.936 18.944 23.576 21.296 23.576C23.344 23.576 24.064 23.128 24.064 22.12C24.064 21.192 23.52 20.84 22.16 20.584L19.536 20.152C17.728 19.832 16.448 19 16.448 17.24C16.448 15.688 17.728 14.12 21.056 14.12C24.192 14.12 25.616 15.688 25.616 17.784V17.88H23.904V17.672C23.904 16.36 23.12 15.704 20.896 15.704C18.944 15.704 18.176 16.184 18.176 17.144C18.176 18.072 18.72 18.376 19.984 18.648L22.592 19.096C24.736 19.48 25.792 20.456 25.792 22.024C25.792 23.656 24.464 25.16 21.296 25.16ZM32.2348 25H30.4108C28.6988 25 27.6428 24.248 27.6428 22.312V18.488H26.2988V17.048H27.6428V15.304H29.3548V17.048H32.2348V18.488H29.3548V22.216C29.3548 23.192 29.8028 23.448 30.7948 23.448H32.2348V25ZM35.6516 25.16C34.0036 25.16 32.9636 24.392 32.9636 23.08C32.9636 21.848 33.9556 21.208 35.5236 21.032L39.1396 20.648V20.184C39.1396 18.872 38.5636 18.408 37.0436 18.408C35.5716 18.408 34.8516 18.888 34.8516 20.056V20.12H33.1396V20.056C33.1396 18.248 34.6436 16.888 37.1716 16.888C39.6996 16.888 40.8356 18.264 40.8356 20.168V25H39.2516V23.016H39.1396C38.7236 24.36 37.4596 25.16 35.6516 25.16ZM34.6916 22.968C34.6916 23.608 35.1236 23.912 36.1156 23.912C37.9236 23.912 39.1396 23.24 39.1396 21.672L36.0196 22.024C35.1236 22.136 34.6916 22.344 34.6916 22.968ZM44.1061 25H42.3781V17.048H43.9621V19.192H44.0741C44.3141 17.912 45.1781 16.888 46.8101 16.888C48.6181 16.888 49.4021 18.184 49.4021 19.688V20.728H47.6901V20.024C47.6901 18.888 47.2101 18.36 46.0261 18.36C44.6661 18.36 44.1061 19.112 44.1061 20.536V25ZM55.7035 25H53.8795C52.1675 25 51.1115 24.248 51.1115 22.312V18.488H49.7675V17.048H51.1115V15.304H52.8235V17.048H55.7035V18.488H52.8235V22.216C52.8235 23.192 53.2715 23.448 54.2635 23.448H55.7035V25ZM64.0148 25.16C60.8148 25.16 59.1828 23.752 59.1828 21.496V21.4H60.9108V21.656C60.9108 22.936 61.6628 23.576 64.0148 23.576C66.0628 23.576 66.7828 23.128 66.7828 22.12C66.7828 21.192 66.2388 20.84 64.8788 20.584L62.2548 20.152C60.4468 19.832 59.1668 19 59.1668 17.24C59.1668 15.688 60.4468 14.12 63.7748 14.12C66.9108 14.12 68.3348 15.688 68.3348 17.784V17.88H66.6228V17.672C66.6228 16.36 65.8388 15.704 63.6148 15.704C61.6628 15.704 60.8948 16.184 60.8948 17.144C60.8948 18.072 61.4388 18.376 62.7028 18.648L65.3108 19.096C67.4548 19.48 68.5108 20.456 68.5108 22.024C68.5108 23.656 67.1828 25.16 64.0148 25.16ZM73.7375 25.16C71.1295 25.16 69.4175 23.688 69.4175 21.032C69.4175 18.552 71.1135 16.888 73.7055 16.888C76.1695 16.888 77.8495 18.248 77.8495 20.664C77.8495 20.952 77.8335 21.176 77.7855 21.416H71.0335C71.0975 22.952 71.8495 23.768 73.6895 23.768C75.3535 23.768 76.0415 23.224 76.0415 22.28V22.152H77.7695V22.296C77.7695 23.992 76.1055 25.16 73.7375 25.16ZM73.6735 18.248C71.9135 18.248 71.1455 19.032 71.0495 20.456H76.2175V20.424C76.2175 18.952 75.3695 18.248 73.6735 18.248ZM80.8718 25H79.1438V14.28H80.8718V25ZM84.1999 25H82.4719V14.28H84.1999V25ZM87.528 16.12H85.8V14.28H87.528V16.12ZM87.528 25H85.8V17.048H87.528V25ZM90.8561 25H89.1281V17.048H90.7121V19.512H90.8241C91.0641 18.168 92.1201 16.888 94.1361 16.888C96.3441 16.888 97.4321 18.376 97.4321 20.216V25H95.7041V20.68C95.7041 19.192 95.0321 18.44 93.3841 18.44C91.6401 18.44 90.8561 19.336 90.8561 21.064V25ZM102.428 24.28C100.06 24.28 98.6519 22.792 98.6519 20.584C98.6519 18.376 100.124 16.888 102.54 16.888C104.204 16.888 105.452 17.64 105.74 19.032H105.836V17.048H107.42V24.072C107.42 26.744 105.756 27.88 103.148 27.88C100.796 27.88 99.1639 26.776 99.1639 24.856H100.876C100.876 26.008 101.548 26.44 103.244 26.44C105.052 26.44 105.708 25.944 105.708 24.168V22.216H105.596C105.308 23.416 104.236 24.28 102.428 24.28ZM100.396 20.584C100.396 22.216 101.356 22.792 102.988 22.792C104.748 22.792 105.708 22.056 105.708 20.648V20.424C105.708 19.08 104.716 18.392 103.036 18.392C101.372 18.392 100.396 18.952 100.396 20.584Z"
      fill="black"
    />
  </svg>
);

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useGuestCart();
  const { wishlistCount } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="container mx-auto">
        {/* Rounded pill container */}
        <div className="bg-[#1a1a1a]/95 backdrop-blur-lg rounded-full border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-6 md:px-8 h-16 md:h-[72px]">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <Image
                  src="/loka-logo/loka-main-white.png"
                  alt="Loka"
                  width={120}
                  height={40}
                  className="h-8 md:h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation - Clean and minimal */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                {/* Main navigation links */}
                <Link
                  href="/products"
                  className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: "var(--nav-text)" }}
                >
                  Discover
                </Link>

                {isAuthenticated ? (
                  <>
                    {user?.role === "creator" && (
                      <Link
                        href="/dashboard/creator"
                        className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                        style={{ color: "var(--nav-text)" }}
                      >
                        Creator Hub
                      </Link>
                    )}

                    {user?.role === "admin" && (
                      <Link
                        href="/dashboard/admin"
                        className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                        style={{ color: "var(--nav-text)" }}
                      >
                        Admin
                      </Link>
                    )}

                    {user?.role === "user" && (
                      <>
                        <Link
                          href="/wishlist"
                          className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity flex items-center relative"
                          style={{ color: "var(--nav-text)" }}
                        >
                          <Heart className="w-5 h-5" />
                          {wishlistCount > 0 && (
                            <span
                              className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold"
                              style={{ background: "var(--nav-hover-bg)" }}
                            >
                              {wishlistCount > 99 ? "99+" : wishlistCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/addresses"
                          className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity flex items-center"
                          style={{ color: "var(--nav-text)" }}
                        >
                          <MapPin className="w-5 h-5" />
                        </Link>
                        <Link
                          href="/cart"
                          className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity flex items-center relative"
                          style={{ color: "var(--nav-text)" }}
                        >
                          <ShoppingBag className="w-5 h-5" />
                          {cartCount > 0 && (
                            <span
                              className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold"
                              style={{ background: "var(--nav-hover-bg)" }}
                            >
                              {cartCount > 99 ? "99+" : cartCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}

                    {/* Separator */}
                    <div
                      className="h-8 w-px mx-4"
                      style={{ background: "var(--nav-border-light)" }}
                    ></div>

                    {/* User section */}
                    <Link
                      href="/profile"
                      className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity flex items-center"
                      style={{ color: "var(--nav-text)" }}
                    >
                      <User className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={logout}
                      className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ color: "var(--nav-text)" }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/cart"
                      className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity flex items-center relative"
                      style={{ color: "var(--nav-text)" }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span
                          className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-extrabold"
                          style={{ background: "var(--nav-hover-bg)" }}
                        >
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </Link>

                    {/* Separator */}
                    <div
                      className="h-8 w-px mx-4"
                      style={{ background: "var(--nav-border-light)" }}
                    ></div>

                    {/* Action buttons */}
                    <Link
                      href="/auth/login"
                      className="text-white px-0 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: "var(--nav-text)" }}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="px-4 py-2 rounded-full text-black text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ background: "#FF6D1F", fontWeight: 500 }}
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button and Join Now button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
                style={{ color: "var(--nav-text)" }}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              {!isAuthenticated && (
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-full text-black text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ background: "#FF6D1F", fontWeight: 500 }}
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - Glassmorphism design */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 mx-4 rounded-2xl p-4 space-y-3 bg-[#1a1a1a]/95 backdrop-blur-lg border border-white/10">
          <Link
            href="/products"
            className="text-white font-medium block px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: "var(--nav-text)" }}
            onClick={() => setIsMenuOpen(false)}
          >
            Discover
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === "creator" && (
                <Link
                  href="/dashboard/creator"
                  className="text-white font-medium block px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: "var(--nav-text)" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Creator Hub
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  href="/dashboard/admin"
                  className="text-white font-medium block px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: "var(--nav-text)" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}

              {user?.role === "user" && (
                <>
                  <Link
                    href="/wishlist"
                    className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: "var(--nav-text)" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span
                        className="ml-auto text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold"
                        style={{ background: "var(--nav-hover-bg)" }}
                      >
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/addresses"
                    className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: "var(--nav-text)" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="w-5 h-5 mr-3" />
                    Addresses
                  </Link>
                  <Link
                    href="/cart"
                    className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: "var(--nav-text)" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag className="w-5 h-5 mr-3" />
                    Cart
                    {cartCount > 0 && (
                      <span
                        className="ml-auto text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold"
                        style={{ background: "var(--nav-hover-bg)" }}
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <Link
                href="/profile"
                className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: "var(--nav-text)" }}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Link>

              <div
                className="border-t mt-3 pt-3"
                style={{ borderColor: "var(--nav-border-light)" }}
              >
                <div
                  className="px-4 py-2 mb-2 rounded-lg"
                  style={{ background: "var(--nav-hover-bg)" }}
                >
                  <span
                    className="text-sm text-white font-medium"
                    style={{ color: "var(--nav-text)" }}
                  >
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity w-full cursor-pointer"
                  style={{ color: "var(--nav-text)" }}
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
                className="text-white font-medium flex items-center px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: "var(--nav-text)" }}
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                Cart
                {cartCount > 0 && (
                  <span
                    className="ml-auto text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-extrabold"
                    style={{ background: "var(--nav-hover-bg)" }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              <div
                className="border-t mt-3 pt-3 space-y-2"
                style={{ borderColor: "var(--nav-border-light)" }}
              >
                <Link
                  href="/auth/login"
                  className="text-white font-medium block px-4 py-2 rounded-lg hover:opacity-80 transition-opacity text-center"
                  style={{ color: "var(--nav-text)" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-full text-black text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ background: "#FF6D1F", fontWeight: 500 }}
                >
                  Join Now
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
