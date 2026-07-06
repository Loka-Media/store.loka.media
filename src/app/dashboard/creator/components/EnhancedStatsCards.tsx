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
  const safeStats = {
    totalProducts: Math.max(0, Number(stats.totalProducts) || 0),
    activeProducts: Math.max(0, Number(stats.activeProducts) || 0),
    totalSales: Math.max(0, Number(stats.totalSales) || 0),
    revenue: Math.max(0, Number(stats.revenue) || 0),
  };

  const statItems = [
    {
      name: 'Total Products',
      value: safeStats.totalProducts,
      icon: TotalProductsIcon,
      iconColor: 'text-blue-400',
      borderColor: 'from-blue-500/20 to-blue-400/10',
    },
    {
      name: 'Active Products',
      value: safeStats.activeProducts,
      icon: ActiveProductsIcon,
      iconColor: 'text-green-400',
      borderColor: 'from-green-500/20 to-green-400/10',
    },
    {
      name: 'Total Sales',
      value: safeStats.totalSales,
      icon: TotalSalesIcon,
      iconColor: 'text-purple-400',
      borderColor: 'from-purple-500/20 to-purple-400/10',
    },
    {
      name: 'Revenue',
      value: `$${safeStats.revenue.toFixed(2)}`,
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
          className="gradient-border-white-top p-4 sm:p-5 rounded-2xl group hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300"
        >
          <div className="flex flex-col h-full">
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div
                className={`${item.iconColor} opacity-80 group-hover:opacity-100 transition-opacity w-8 h-8 sm:w-10 sm:h-10`}
              >
                <item.icon />
              </div>

              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {item.value}
              </span>
            </div>

            {/* Bottom Label */}
            <div className="mt-8 flex justify-end">
              <p className="text-gray-400 text-sm sm:text-base font-medium">
                {item.name}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
