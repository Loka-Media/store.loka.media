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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <div className="gradient-border-white-bottom relative h-[170px] p-5 group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300 cursor-pointer">

              {/* Top */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white !text-2xl font-bold leading-tight">
                    {action.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    {action.description}
                  </p>
                </div>

                <div className="w-8 h-8 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowIcon />
                </div>
              </div>

              {/* Bottom Left Icon */}
              <div className="absolute left-5 bottom-5">
                <div className={`${action.iconColor} w-10 h-10`}>
                  <action.icon />
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
