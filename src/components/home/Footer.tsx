"use client";

import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-black border-t border-yellow-300 py-12 md:py-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-pink-400 rounded-full opacity-10 hidden lg:block"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-yellow-300 rounded-2xl opacity-10 hidden lg:block rotate-12"></div>

      <div className="container mx-auto px-6 lg:px-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Left Section: Logo + Info */}
          <div className="flex flex-col space-y-4 col-span-1 md:col-span-2 lg:col-span-2">
            <span className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">Loka Media</span>
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-yellow-300/30 transition-all">
              <p className="text-sm text-gray-300 font-medium">WINNIPEG | TORONTO | LOS ANGELES | INDIA</p>
              <p className="text-sm text-gray-300 font-medium">1-888-568-5652 (loka)</p>
              <p className="text-sm text-yellow-300 font-bold">hello@loka.media</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-extrabold text-white bg-yellow-300 text-black px-3 py-1.5 rounded-lg inline-block w-fit">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/help" className="text-sm text-gray-300 hover:text-yellow-300 transition-colors font-medium hover:translate-x-1 inline-block">
                Help & Center
              </a>
              <a href="/about" className="text-sm text-gray-300 hover:text-yellow-300 transition-colors font-medium hover:translate-x-1 inline-block">
                About Us
              </a>
              <a href="/contact" className="text-sm text-gray-300 hover:text-yellow-300 transition-colors font-medium hover:translate-x-1 inline-block">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-extrabold text-white bg-pink-400 text-black px-3 py-1.5 rounded-lg inline-block w-fit">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/privacy" className="text-sm text-gray-300 hover:text-pink-300 transition-colors font-medium hover:translate-x-1 inline-block">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-300 hover:text-pink-300 transition-colors font-medium hover:translate-x-1 inline-block">
                Terms of Service
              </a>
              <a href="/returns" className="text-sm text-gray-300 hover:text-pink-300 transition-colors font-medium hover:translate-x-1 inline-block">
                Returns & Refunds
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Social Icons and Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a
              href="#"
              aria-label="Instagram"
              className="bg-pink-400 text-black p-3 rounded-full hover:bg-pink-300 transition-all border border-black hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="bg-yellow-300 text-black p-3 rounded-full hover:bg-yellow-200 transition-all border border-black hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} Loka Media. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
