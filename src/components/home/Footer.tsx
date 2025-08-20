"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white relative overflow-hidden">
      {/* Circular "MORE HAPPY FANS" text in top right */}
      <div className="absolute top-8 right-8 w-32 h-32">
        <div className="relative w-full h-full">
          <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            <defs>
              <path
                id="circle"
                d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
              />
            </defs>
            <text className="text-[8px] fill-blue-500 font-semibold">
              <textPath href="#circle">
                MORE HAPPY FANS • MORE HAPPY FANS • 
              </textPath>
            </text>
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Hero section */}
        <div className="text-center mb-14">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
            Build your brand,
            <br />
            audience, and income.
          </h2>
          <Link 
            href="/signup" 
            className="inline-flex items-center text-blue-500 text-xl font-semibold hover:text-blue-400 transition-colors group"
          >
            Get started
            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Browse Products</Link></li>
              <li><Link href="/dashboard/creator/canvas" className="hover:text-white transition-colors">Design Studio</Link></li>
              <li><Link href="/dashboard/creator/products" className="hover:text-white transition-colors">Creator Dashboard</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Start Creating</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">How it Works</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns & FAQ</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/press" className="hover:text-white transition-colors">Press Kit</Link></li>
              <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>

          {/* Creator Resources */}
          <div>
            <h3 className="text-white font-semibold mb-3">Creator Resources</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/creator-guide" className="hover:text-white transition-colors">Creator Guide</Link></li>
              <li><Link href="/design-tips" className="hover:text-white transition-colors">Design Tips</Link></li>
              <li><Link href="/quality-standards" className="hover:text-white transition-colors">Quality Standards</Link></li>
              <li><Link href="/creator-earnings" className="hover:text-white transition-colors">Earnings Info</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/intellectual-property" className="hover:text-white transition-colors">IP Policy</Link></li>
              <li><Link href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://instagram.com/lokamedia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com/lokamedia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="https://youtube.com/lokamedia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a></li>
              <li><a href="https://discord.gg/lokamedia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</a></li>
              <li><a href="https://tiktok.com/@lokamedia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col lg:flex-row justify-between items-center mt-11 pt-6 border-t border-gray-800">
          {/* Left side - Logo and language */}
          <div className="flex items-center space-x-8 mb-6 lg:mb-0">
            <div className="text-2xl font-bold">fw</div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-sm">English</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Center - Legal links */}
          <div className="flex flex-wrap justify-center items-center space-x-6 text-xs text-gray-500 mb-6 lg:mb-0">
            <span>© 2024 Loka Media</span>
            <Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <Link href="/returns" className="hover:text-white transition-colors">RETURNS & FAQ</Link>
          </div>

          {/* Right side - Scroll to top */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </footer>
  );
}
