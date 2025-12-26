'use client';

import Link from 'next/link';
import { TotalProductsIcon, CustomCatalogIcon, LokaProductsIcon, DesignCanvasIcon, DesignFilesIcon, ArrowIcon } from './QuickActionIcons';

export function EnhancedQuickActions() {
  const actions = [
    {
      href: '/dashboard/creator/catalog',
      icon: CustomCatalogIcon,
      title: 'Custom Catalog',
      description: 'Customizable products',
      iconColor: 'text-orange-400',
    },
    {
      href: '/dashboard/creator/loka-products',
      icon: LokaProductsIcon,
      title: 'Loka Products',
      description: 'Browse & publish products',
      iconColor: 'text-purple-400',
    },
    {
      href: '/dashboard/creator/canvas',
      icon: DesignCanvasIcon,
      title: 'Design Canvas',
      description: 'Create stunning designs',
      iconColor: 'text-green-400',
    },
    {
      href: '/dashboard/creator/files',
      icon: DesignFilesIcon,
      title: 'Design Files',
      description: 'Manage your assets',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="mb-12">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Quick Actions</h2>
        <p className="text-sm sm:text-base text-gray-400 font-medium mt-2">Jump to your most-used tools</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <div className="gradient-border-white-top p-6 sm:p-8 group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300 flex flex-col h-full cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className={`${action.iconColor} opacity-70 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 sm:w-10 sm:h-10`}>
                  <action.icon />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-0 group-hover:translate-x-1">
                  <ArrowIcon />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-white/80 transition-colors">
                {action.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
