'use client';

import { Phone, Mail, Globe, Instagram } from 'lucide-react';
import Image from 'next/image';

/**
 * Footer component with three-section layout:
 * - Top: Contact info (left) + Newsletter (right)
 * - Middle: Logo + Tagline (centered)
 * - Bottom: Copyright (left) + Legal links (right)
 */
export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: '#0a0806',
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/footer-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Top Section */}
      <div
        className="relative z-10 px-6 py-8 md:px-8 md:py-12 max-w-7xl mx-auto lg:px-20 flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-10"
        style={{
          paddingTop: '40px',
          paddingBottom: '30px',
        }}
      >
        {/* Logo - Top on mobile, hidden on desktop */}
        <div className="lg:hidden w-full flex justify-start mb-4">
          <Image
            src="/loka-logo/full-logo.png"
            alt="Loka Logo"
            width={180}
            height={72}
            className="h-auto"
          />
        </div>

        {/* Left Column: Contact Us */}
        <div className="w-full lg:flex-1 lg:min-w-[250px]">
          <h3
            className="text-xl md:text-2xl lg:text-base"
            style={{
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '16px',
            }}
          >
            Contact Us
          </h3>

          {/* Contact row with phone and email */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 mb-3">
            <a
              href="tel:1-888-568-5652"
              className="flex items-center gap-2 text-[#cccccc] text-sm md:text-base lg:text-sm no-underline transition-colors duration-200 hover:text-[#FF6B00]"
            >
              <Phone size={16} className="text-[#FF6B00] flex-shrink-0" />
              <span>1-888-568-5652 (loka)</span>
            </a>

            <a
              href="mailto:hello@loka.media"
              className="flex items-center gap-2 text-[#cccccc] text-sm md:text-base lg:text-sm no-underline transition-colors duration-200 hover:text-[#FF6B00]"
            >
              <Mail size={16} className="text-[#FF6B00] flex-shrink-0" />
              <span>hello@loka.media</span>
            </a>
          </div>

          {/* Locations */}
          <div className="flex items-center gap-2 text-[#cccccc] text-sm md:text-base lg:text-sm">
            <Globe size={16} className="text-[#FF6B00] flex-shrink-0" />
            <span style={{ fontWeight: '600', letterSpacing: '0.05em' }}>Winnipeg &nbsp;|&nbsp; Toronto &nbsp;|&nbsp; Los Angeles &nbsp;|&nbsp; India</span>
          </div>
        </div>

        {/* Right Column: Newsletter */}
        <div className="w-full lg:flex-1 lg:min-w-[300px] lg:max-w-[400px]">
          <h3 className="text-xl md:text-2xl lg:text-base font-semibold text-white mb-3 lg:mb-3">
            Subscribe to Our Newsletter
          </h3>

          <p className="text-sm md:text-base lg:text-xs text-[#999999] leading-relaxed mb-4 lg:mb-4">
            We make sure to only send emails that help you market better and monetize more. #LFG
          </p>

          {/* Newsletter Form */}
          <div className="flex gap-0 flex-col">
            <div className="flex gap-0">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 px-3 py-2.5 md:px-4 md:py-3 lg:px-4 lg:py-3 bg-transparent border border-[#3a3530] border-r-0 rounded-l text-white text-sm md:text-base lg:text-sm outline-none transition-colors duration-200 focus:border-[#FF6B00]"
              />
              <button
                type="button"
                className="px-5 py-2.5 md:px-6 md:py-3 lg:px-6 lg:py-3 bg-[#FF6B00] border-none rounded-r text-black text-sm md:text-base lg:text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#ff8533]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Logo - Hidden on mobile since logo is at top */}
      <div
        className="relative z-10 hidden lg:flex"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
          maxWidth: '100%',
        }}
      >
        <Image
          src="/loka-logo/full-logo.png"
          alt="Loka Logo"
          width={200}
          height={80}
          className="h-auto"
        />
      </div>

      {/* Bottom Section - Copyright Bar */}
      <div
        className="relative z-10 flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 px-6 py-5 sm:px-12 md:px-20 lg:px-20 border-t border-[#2a2520]"
      >
        <a
          href="https://www.instagram.com/_loka.media_"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-200 order-1 sm:order-2"
          style={{ color: '#FF6D1F' }}
        >
          <Instagram size={16} />
        </a>

        <p className="text-xs text-white order-2 sm:order-1" style={{ fontWeight: '400' }}>
          Copyright @ 2026 loka.media
        </p>

        <div className="flex items-center gap-3 order-3 sm:order-3">
          <a
            href="/terms"
            className="text-xs text-white no-underline transition-colors duration-200 hover:text-[#FF6B00]"
            style={{ fontWeight: '400' }}
          >
            Terms of Use
          </a>
          <span className="text-white">|</span>
          <a
            href="/privacy"
            className="text-xs text-white no-underline transition-colors duration-200 hover:text-[#FF6B00]"
            style={{ fontWeight: '400' }}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
