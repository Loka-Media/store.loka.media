'use client';

import { ExternalLink, Package, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import GradientTitle from '@/components/ui/GradientTitle';

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface DashboardHeaderProps {
  connection: ConnectionStatus | null;
  onConnectPrintful: () => void;
}

export function EnhancedDashboardHeader({ connection, onConnectPrintful }: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState<string>("");

  useEffect(() => {
    // Get creator username from localStorage or session
    const username = localStorage.getItem("creatorUsername") || localStorage.getItem("username");
    if (username) {
      setCreatorUsername(username);
    }
  }, []);

  const handleShare = async () => {
    if (!creatorUsername) return;

    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${creatorUsername}/shop`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Creator Shop",
          text: "Check out my exclusive products",
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="border-b border-white/10 pb-8 sm:pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-8">
        <div className="flex-1">
          <div className="mb-6">
            <GradientTitle text="Creator Dashboard" size="sm" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl" />
            <p className="mt-3 text-sm sm:text-base text-gray-400 font-medium">
              Manage your products, integrations, and sales performance
            </p>
          </div>
        </div>

        {connection?.connected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
            <button
              onClick={handleShare}
              disabled={!creatorUsername}
              className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition-all duration-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed animate-share-flicker"
              title="Share your creator profile"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {copied ? "Copied!" : "Share"}
            </button>
            <Link
              href="/dashboard/creator/products"
              className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              My Products
            </Link>
          </div>
        ) : (
          <button
            onClick={onConnectPrintful}
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-[0_10px_30px_rgba(255,99,71,0.3)] transition-all duration-300 text-sm sm:text-base flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Connect Printful
          </button>
        )}
      </div>
    </div>
  );
}
