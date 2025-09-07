"use client";

import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-black text-white py-12">
      <div className="container mx-auto px-6 lg:px-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Left Section: Logo + Info */}
          <div className="flex flex-col space-y-4 lg:space-y-6 col-span-1 md:col-span-2 lg:col-span-2">
            <Image
              src="/loka-logo/loka-main-white.png"
              alt="Loka Logo"
              width={160}
              height={66}
              className="object-contain"
              priority
            />
            <div className="space-y-2">
              <p className="text-sm text-gray-300">WINNIPEG | TORONTO | LOS ANGELES | INDIA</p>
              <p className="text-sm text-gray-300">1-888-568-5652 (loka)</p>
              <p className="text-sm text-gray-300">hello@loka.media</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-orange-500">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/help" className="text-sm text-gray-300 hover:text-white transition-colors">
                Help & Center
              </a>
              <a href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
                About Us
              </a>
              <a href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-orange-500">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/privacy" className="text-sm text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/returns" className="text-sm text-gray-300 hover:text-white transition-colors">
                Returns & Refunds
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Social Icons and Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a href="#" aria-label="Instagram">
              <Instagram className="w-6 h-6 hover:text-orange-500 transition-colors" />
            </a>
            <a href="#" aria-label="YouTube">
              <Youtube className="w-6 h-6 hover:text-orange-500 transition-colors" />
            </a>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Loka. All rights reserved.
          </p>
        </div>
      </div>

      {/* Background circle (still decorative) */}
      <div className="absolute top-8 right-8 w-32 h-32 hidden lg:block">
        <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute inset-4 bg-orange-500 rounded-full opacity-30 animate-pulse delay-150"></div>
        <div className="absolute inset-8 bg-orange-500 rounded-full opacity-40 animate-pulse delay-300"></div>
      </div>
    </footer>
  );
}
