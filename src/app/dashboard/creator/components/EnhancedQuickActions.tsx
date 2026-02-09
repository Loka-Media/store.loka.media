"use client";

import Link from "next/link";
import {
  TotalProductsIcon,
  CustomCatalogIcon,
  DesignFilesIcon,
  EarningsIcon,
  SettingsIcon,
  ArrowIcon,
} from "./QuickActionIcons";

export function EnhancedQuickActions() {
  // Note: Loka Products card is intentionally hidden from the quick actions
  // The LokaProductsIcon import has been removed - do not re-add this card
  const actions = [
    {
      href: "/dashboard/creator/catalog",
      icon: CustomCatalogIcon,
      title: "Design Products",
      description: "Customizable products",
      iconColor: "text-orange-400",
    },
    {
      href: "/dashboard/creator/files",
      icon: DesignFilesIcon,
      title: "Design Files",
      description: "Manage your assets",
      iconColor: "text-blue-400",
    },
    {
      href: "/dashboard/creator/earnings",
      icon: EarningsIcon,
      title: "Earnings",
      description: "Track commissions & payouts",
      iconColor: "text-yellow-400",
    },
    {
      href: "/dashboard/creator/settings/stripe",
      icon: SettingsIcon,
      title: "Settings",
      description: "Manage Stripe account",
      iconColor: "text-pink-400",
    },
  ];

  return (
    <div className="mb-12">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Quick Actions
        </h2>
        <p className="text-sm sm:text-base text-gray-400 font-medium mt-2">
          Jump to your most-used tools
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4 lg:gap-6">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <div className="gradient-border-white-top p-4 sm:p-6 md:p-8 group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300 flex flex-col h-full cursor-pointer relative">
              <div className="flex items-start justify-between mb-4 sm:mb-6 md:mb-8">
                <div
                  className={`${action.iconColor} opacity-70 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16`}
                >
                  <action.icon />
                </div>
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-white/80 transition-colors line-clamp-2">
                {action.title}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 font-medium line-clamp-2">
                {action.description}
              </p>
              <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8">
                <ArrowIcon />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
