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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="gradient-border-white-top p-4 sm:p-6 md:p-8 group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <dt className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                {item.name}
              </dt>
              <dd className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {item.value}
              </dd>
            </div>
            <div className={`${item.iconColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300 h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 flex-shrink-0`}>
              <item.icon />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
