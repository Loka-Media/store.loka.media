'use client';

import { ExternalLink, Package, Share2, Copy, Check, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import GradientTitle from '@/components/ui/GradientTitle';
import toast from 'react-hot-toast';

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface DashboardHeaderProps {
  connection: ConnectionStatus | null;
  onConnectPrintful: () => void;
  creatorUsername?: string;
}

export function EnhancedDashboardHeader({
  connection,
  onConnectPrintful,
  creatorUsername = ""
}: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);

  const slug = creatorUsername.trim().toLowerCase().replace(/\s+/g, '');
  const shopPath = slug ? `/shop/${slug}` : '/shop';
  const publicStoreUrl = slug ? `https://shop.loka.media/shop/${slug}` : '';

  const handleCopy = async () => {
    if (!publicStoreUrl) return;
    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      setCopied(true);
      toast.success('Store link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!publicStoreUrl) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "My Creator Shop",
          text: "Check out my exclusive products on Loka!",
          url: publicStoreUrl,
        });
      } catch (err) {
        // User dismissed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="border-b border-white/10 pb-8 sm:pb-12">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pt-4">
        <div className="flex-1">
          <div className="mb-3">
            <GradientTitle text="Creator Dashboard" size="sm" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl" />
            <p className="mt-2 text-sm sm:text-base text-gray-400 font-medium">
              Manage your products, integrations, and store performance
            </p>
          </div>

          {/* Public Store Link Bar */}
          {slug && (
            <div className="inline-flex flex-wrap items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-400" />
                Store Link:
              </span>
              <span className="text-xs font-mono text-white select-all max-w-[280px] sm:max-w-md truncate" title={publicStoreUrl}>
                {publicStoreUrl}
              </span>
              <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy Store Link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Share Store Link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <Link
                  href={shopPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs rounded-md flex items-center gap-1 transition-colors"
                >
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {slug && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-neutral-900 border border-white/20 hover:border-orange-500/50 hover:bg-neutral-800 rounded-lg font-bold text-white transition-all duration-300 text-sm shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4 mr-2 text-orange-400" />
              Share Store
            </button>
          )}

          <Link
            href="/dashboard/creator/orders"
            className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-black transition-all duration-300 text-sm shadow-lg shadow-orange-500/20"
          >
            <Package className="w-4 h-4 mr-2" />
            Orders
          </Link>
          <Link
            href="/dashboard/creator/products"
            className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-white/10 border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition-all duration-300 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            My Products
          </Link>
        </div>
      </div>
    </div>
  );
}
