"use client";

import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-gray-200 py-16 md:py-20">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Left Section: Logo + Info */}
          <div className="flex flex-col space-y-6 col-span-1 md:col-span-2 lg:col-span-2">
            <span className="text-2xl font-black text-black tracking-tight">Loka Media</span>
            <div className="space-y-3">
              <p className="text-base text-foreground-muted font-medium">WINNIPEG | TORONTO | LOS ANGELES | INDIA</p>
              <p className="text-base text-foreground-muted font-medium">1-888-568-5652 (loka)</p>
              <p className="text-base text-foreground-muted font-medium">hello@loka.media</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-5">
            <h3 className="text-base font-black text-black">Quick Links</h3>
            <nav className="flex flex-col space-y-3">
              <a href="/help" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                Help & Center
              </a>
              <a href="/about" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                About Us
              </a>
              <a href="/contact" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-5">
            <h3 className="text-base font-black text-black">Legal</h3>
            <nav className="flex flex-col space-y-3">
              <a href="/privacy" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                Privacy Policy
              </a>
              <a href="/terms" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                Terms of Service
              </a>
              <a href="/returns" className="text-base text-foreground-muted hover:text-black transition-colors font-semibold">
                Returns & Refunds
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Social Icons and Copyright */}
        <div className="border-t border-gray-200 pt-10 flex flex-col md:flex-row items-center justify-between">
          <div className="flex space-x-8 mb-6 md:mb-0">
            <a href="#" aria-label="Instagram" className="text-foreground-muted hover:text-black transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" aria-label="YouTube" className="text-foreground-muted hover:text-black transition-colors">
              <Youtube className="w-6 h-6" />
            </a>
          </div>
          <p className="text-base text-foreground-muted font-medium">
            © {new Date().getFullYear()} Loka Media. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
