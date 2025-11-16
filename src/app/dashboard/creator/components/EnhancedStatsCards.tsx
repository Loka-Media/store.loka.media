'use client';

import { Package, Eye, ShoppingBag, TrendingUp } from 'lucide-react';

interface StatsProps {
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    revenue: number;
  };
}

export function EnhancedStatsCards({ stats }: StatsProps) {
  const statItems = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-blue-300 to-blue-400',
      iconBg: 'bg-blue-400',
    },
    {
      name: 'Active Products',
      value: stats.activeProducts,
      icon: Eye,
      gradient: 'from-green-300 to-green-400',
      iconBg: 'bg-green-400',
    },
    {
      name: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingBag,
      gradient: 'from-purple-300 to-purple-400',
      iconBg: 'bg-purple-400',
    },
    {
      name: 'Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: TrendingUp,
      gradient: 'from-orange-300 to-pink-400',
      iconBg: 'bg-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${item.gradient} border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 group cursor-pointer`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <dt className="text-sm font-extrabold text-black/70 uppercase tracking-wider mb-2">
                  {item.name}
                </dt>
                <dd className="text-4xl font-extrabold text-black">
                  {item.value}
                </dd>
              </div>
              <div className={`${item.iconBg} border-4 border-black rounded-xl p-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-2 bg-black/20"></div>
        </div>
      ))}
    </div>
  );
}
