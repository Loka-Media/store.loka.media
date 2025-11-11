"use client";

import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-gray-200 py-12 md:py-16">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Left Section: Logo + Info */}
          <div className="flex flex-col space-y-4 col-span-1 md:col-span-2 lg:col-span-2">
            <span className="text-xl font-extrabold text-black tracking-tight">Loka Media</span>
            <div className="space-y-2">
              <p className="text-sm text-foreground-muted">WINNIPEG | TORONTO | LOS ANGELES | INDIA</p>
              <p className="text-sm text-foreground-muted">1-888-568-5652 (loka)</p>
              <p className="text-sm text-foreground-muted">hello@loka.media</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/help" className="text-sm text-foreground-muted hover:text-black transition-colors">
                Help & Center
              </a>
              <a href="/about" className="text-sm text-foreground-muted hover:text-black transition-colors">
                About Us
              </a>
              <a href="/contact" className="text-sm text-foreground-muted hover:text-black transition-colors">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/privacy" className="text-sm text-foreground-muted hover:text-black transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-foreground-muted hover:text-black transition-colors">
                Terms of Service
              </a>
              <a href="/returns" className="text-sm text-foreground-muted hover:text-black transition-colors">
                Returns & Refunds
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section: Social Icons and Copyright */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a href="#" aria-label="Instagram" className="text-foreground-muted hover:text-black transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="YouTube" className="text-foreground-muted hover:text-black transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} Loka Media. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
