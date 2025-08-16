'use client';

import { ShoppingBag, Plus, Upload, Palette, Store } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      href: '/dashboard/creator/catalog',
      icon: ShoppingBag,
      title: 'Custom Catalog',
      description: 'Customizable products',
    },
    {
      href: '/dashboard/creator/loka-products',
      icon: Store,
      title: 'Loka Products',
      description: 'Browse & publish products',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {actions.map((action, index) => (
        <Link href={action.href} key={index}>
          <div className="relative group overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="p-6 relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-800 rounded-full p-3 group-hover:bg-orange-600 transition-colors duration-300">
                  <action.icon className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

