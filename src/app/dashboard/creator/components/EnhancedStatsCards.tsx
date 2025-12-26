'use client';

import { TotalProductsIcon, ActiveProductsIcon, TotalSalesIcon, RevenueIcon } from './QuickActionIcons';

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
      icon: TotalProductsIcon,
      iconColor: 'text-blue-400',
      borderColor: 'from-blue-500/20 to-blue-400/10',
    },
    {
      name: 'Active Products',
      value: stats.activeProducts,
      icon: ActiveProductsIcon,
      iconColor: 'text-green-400',
      borderColor: 'from-green-500/20 to-green-400/10',
    },
    {
      name: 'Total Sales',
      value: stats.totalSales,
      icon: TotalSalesIcon,
      iconColor: 'text-purple-400',
      borderColor: 'from-purple-500/20 to-purple-400/10',
    },
    {
      name: 'Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: RevenueIcon,
      iconColor: 'text-orange-400',
      borderColor: 'from-orange-500/20 to-orange-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="gradient-border-white-top p-6 sm:p-8 group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <dt className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                {item.name}
              </dt>
              <dd className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {item.value}
              </dd>
            </div>
            <div className={`${item.iconColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 sm:h-10 sm:w-10`}>
              <item.icon />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
