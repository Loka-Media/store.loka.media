"use client";

import { useState, useEffect, useId, useRef } from "react";
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

export default function StickyHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useGuestCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(true); // Default to dark for dark theme site
  
  // Glass morphism refs and IDs
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);
  
  // Glass morphism parameters
  const glassParams = {
    borderRadius: 24,
    borderWidth: 0.07,
    brightness: 50,
    opacity: 0.93,
    blur: 15,
    displace: 2,
    backgroundOpacity: 0.1,
    saturation: 1.5,
    distortionScale: -180,
    redOffset: 0,
    greenOffset: 10,
    blueOffset: 20,
    xChannel: "R" as const,
    yChannel: "G" as const,
    mixBlendMode: "difference" as const,
  };
  
  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 800;
    const actualHeight = rect?.height || 80;
    const edgeSize = Math.min(actualWidth, actualHeight) * (glassParams.borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${glassParams.borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${glassParams.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${glassParams.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${glassParams.borderRadius}" fill="hsl(0 0% ${glassParams.brightness}% / ${glassParams.opacity})" style="filter:blur(${glassParams.blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };
  
  const updateDisplacementMap = () => {
    feImageRef.current?.setAttribute("href", generateDisplacementMap());
  };
  
  const supportsSVGFilters = () => {
    if (typeof window === "undefined") return false;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement("div");
    div.style.backdropFilter = `url(#${filterId})`;
    return div.style.backdropFilter !== "";
  };
  
  const supportsBackdropFilter = () => {
    if (typeof window === "undefined") return false;
    return CSS.supports("backdrop-filter", "blur(10px)");
  };
  
  const getGlassStyles = (): React.CSSProperties => {
    const svgSupported = supportsSVGFilters();
    const backdropFilterSupported = supportsBackdropFilter();

    if (svgSupported) {
      return {
        background: isDark
          ? `hsl(0 0% 0% / ${glassParams.backgroundOpacity})`
          : `hsl(0 0% 100% / ${glassParams.backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${glassParams.saturation})`,
        boxShadow: isDark
          ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
             0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.1),
             0px 8px 24px rgba(17, 17, 26, 0.1),
             0px 16px 56px rgba(17, 17, 26, 0.1)`
          : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset,
             0 0 10px 4px color-mix(in oklch, black, transparent 90%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05)`,
      };
    } else {
      if (isDark) {
        if (!backdropFilterSupported) {
          return {
            background: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)`,
          };
        } else {
          return {
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px) saturate(1.8) brightness(1.2)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8) brightness(1.2)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.1),
                        0 8px 32px 0 rgba(0, 0, 0, 0.3)`,
          };
        }
      } else {
        if (!backdropFilterSupported) {
          return {
            background: "rgba(255, 255, 255, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.3)`,
          };
        } else {
          return {
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(12px) saturate(1.8) brightness(1.1)",
            WebkitBackdropFilter: "blur(12px) saturate(1.8) brightness(1.1)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.2),
                        0 2px 16px 0 rgba(31, 38, 135, 0.1),
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.2)`,
          };
        }
      }
    }
  };

  // Initialize glass morphism effects
  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: glassParams.redOffset },
      { ref: greenChannelRef, offset: glassParams.greenOffset },
      { ref: blueChannelRef, offset: glassParams.blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute(
          "scale",
          (glassParams.distortionScale + offset).toString()
        );
        ref.current.setAttribute("xChannelSelector", glassParams.xChannel);
        ref.current.setAttribute("yChannelSelector", glassParams.yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute("stdDeviation", glassParams.displace.toString());
  }, []);
  
  // Resize observer for glass morphism
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDisplacementMap, 0);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
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
      <nav 
        ref={containerRef}
        className="rounded-3xl overflow-hidden relative transition-opacity duration-300 ease-out"
        style={getGlassStyles()}
      >
        {/* Advanced Glass Morphism SVG Filters */}
        <svg
          className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feImage
                ref={feImageRef}
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="map"
              />

              <feDisplacementMap
                ref={redChannelRef}
                in="SourceGraphic"
                in2="map"
                id="redchannel"
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="red"
              />

              <feDisplacementMap
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                id="greenchannel"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="green"
              />

              <feDisplacementMap
                ref={blueChannelRef}
                in="SourceGraphic"
                in2="map"
                id="bluechannel"
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="blue"
              />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur
                ref={gaussianBlurRef}
                in="output"
                stdDeviation="0.7"
              />
            </filter>
          </defs>
        </svg>
        <div className="px-4 sm:px-6 lg:px-8">
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
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
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
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
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
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
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
    </div>
  );
}