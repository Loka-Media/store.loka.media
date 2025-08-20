"use client";

import { Instagram, Linkedin, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-black text-white py-12">
      <div className="container mx-auto px-6 lg:px-20 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          {/* Left Section: Logo + Info */}
          <div className="flex flex-col space-y-4 lg:space-y-6 text-left">
            <Image
              src="/loka-logo/loka-main-white.png"
              alt="Logo"
              width={160}
              height={40}
              className="object-contain"
            />
            <p className="text-sm">WINNIPEG | TORONTO | LOS ANGELES | INDIA</p>
            <p className="text-sm">1-888-568-5652 (loka)</p>
            <p className="text-sm">hello@loka.media</p>
          </div>

          {/* Right Section: Social Icons */}
          <div className="flex space-x-6 mt-6 lg:mt-0">
            <a href="#" aria-label="Instagram">
              <Instagram className="w-6 h-6 hover:text-orange-500 transition-colors" />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6 hover:text-orange-500 transition-colors" />
            </a>
            <a href="#" aria-label="YouTube">
              <Youtube className="w-6 h-6 hover:text-orange-500 transition-colors" />
            </a>
          </div>
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
