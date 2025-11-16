'use client';

import { ShoppingBag, Store, Palette, FileImage, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function EnhancedQuickActions() {
  const actions = [
    {
      href: '/dashboard/creator/catalog',
      icon: ShoppingBag,
      title: 'Custom Catalog',
      description: 'Customizable products',
      gradient: 'from-yellow-200 to-orange-300',
      iconBg: 'bg-orange-500',
    },
    {
      href: '/dashboard/creator/loka-products',
      icon: Store,
      title: 'Loka Products',
      description: 'Browse & publish products',
      gradient: 'from-pink-200 to-purple-300',
      iconBg: 'bg-purple-500',
    },
    {
      href: '/dashboard/creator/canvas',
      icon: Palette,
      title: 'Design Canvas',
      description: 'Create stunning designs',
      gradient: 'from-green-200 to-teal-300',
      iconBg: 'bg-teal-500',
    },
    {
      href: '/dashboard/creator/files',
      icon: FileImage,
      title: 'Design Files',
      description: 'Manage your assets',
      gradient: 'from-blue-200 to-indigo-300',
      iconBg: 'bg-indigo-500',
    },
  ];

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-black">Quick Actions</h2>
        <p className="text-gray-700 font-bold mt-1">Jump to your most-used tools</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <div className={`relative group overflow-hidden rounded-2xl border-4 border-black bg-gradient-to-br ${action.gradient} shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${action.iconBg} border-4 border-black rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white border-2 border-black rounded-full p-2 group-hover:bg-black group-hover:translate-x-[4px] group-hover:translate-y-[-4px] transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-black group-hover:text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-black mb-2">
                  {action.title}
                </h3>
                <p className="text-sm font-bold text-black/70">
                  {action.description}
                </p>
              </div>

              {/* Hover accent */}
              <div className="h-2 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
