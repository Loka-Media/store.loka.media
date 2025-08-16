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
          {/* Loka Media */}
          <div>
            <h3 className="text-white font-semibold mb-3">Loka Media</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/shops" className="hover:text-white transition-colors">Shops</Link></li>
              <li><Link href="/homepages" className="hover:text-white transition-colors">Homepages</Link></li>
              <li><Link href="/memberships" className="hover:text-white transition-colors">Memberships</Link></li>
              <li><Link href="/catalog" className="hover:text-white transition-colors">Product catalog</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/design" className="hover:text-white transition-colors">Design & sell</Link></li>
              <li><Link href="/twitch" className="hover:text-white transition-colors">For Twitch creators</Link></li>
              <li><Link href="/youtube" className="hover:text-white transition-colors">For YouTubers</Link></li>
              <li><Link href="/tiktok" className="hover:text-white transition-colors">For Tiktokers</Link></li>
              <li><Link href="/artists" className="hover:text-white transition-colors">For Artists</Link></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-white font-semibold mb-3">Learn</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/examples" className="hover:text-white transition-colors">Examples</Link></li>
              <li><Link href="/designers" className="hover:text-white transition-colors">Designers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help center</Link></li>
              <li><Link href="/discord" className="hover:text-white transition-colors">Discord community</Link></li>
              <li><Link href="/api" className="hover:text-white transition-colors">APIs & developer docs</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact us</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">Loka Media shop</Link></li>
            </ul>
          </div>

          {/* Compare to */}
          <div>
            <h3 className="text-white font-semibold mb-3">Compare to</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/vs-shopify" className="hover:text-white transition-colors">Shopify</Link></li>
              <li><Link href="/vs-spring" className="hover:text-white transition-colors">Spring</Link></li>
              <li><Link href="/vs-redbubble" className="hover:text-white transition-colors">Redbubble</Link></li>
              <li><Link href="/vs-spreadshop" className="hover:text-white transition-colors">Spreadshop</Link></li>
              <li><Link href="/vs-streamlabs" className="hover:text-white transition-colors">Streamlabs</Link></li>
              <li><Link href="/vs-bonfire" className="hover:text-white transition-colors">Bonfire</Link></li>
              <li><Link href="/vs-patreon" className="hover:text-white transition-colors">Patreon</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare all</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-white font-semibold mb-3">Socials</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="https://instagram.com" className="hover:text-white transition-colors">Instagram</Link></li>
              <li><Link href="https://twitter.com" className="hover:text-white transition-colors">X (Twitter)</Link></li>
              <li><Link href="https://twitch.tv" className="hover:text-white transition-colors">Twitch</Link></li>
              <li><Link href="https://discord.com" className="hover:text-white transition-colors">Discord</Link></li>
              <li><Link href="https://youtube.com" className="hover:text-white transition-colors">YouTube</Link></li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h3 className="text-white font-semibold mb-3">Guides</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/getting-started" className="hover:text-white transition-colors">Getting started</Link></li>
              <li><Link href="/creating-products" className="hover:text-white transition-colors">Creating products</Link></li>
              <li><Link href="/ordering-samples" className="hover:text-white transition-colors">Ordering samples</Link></li>
              <li><Link href="/launch-planning" className="hover:text-white transition-colors">Launch planning</Link></li>
              <li><Link href="/launch-checklist" className="hover:text-white transition-colors">Launch checklist</Link></li>
              <li><Link href="/after-launch" className="hover:text-white transition-colors">After launch</Link></li>
              <li><Link href="/growing-brand" className="hover:text-white transition-colors">Growing your brand</Link></li>
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
            <span>© Loka Media</span>
            <Link href="/terms" className="hover:text-white transition-colors">ACCEPTABLE USE POLICY</Link>
            <Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
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
