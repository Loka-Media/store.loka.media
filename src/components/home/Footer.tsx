"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-10 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto">
        <p>&copy; {new Date().getFullYear()} Loka. All rights reserved.</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Link href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
