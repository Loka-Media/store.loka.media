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

export function StatsCards({ stats }: StatsProps) {
  const statItems = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600',
    },
    {
      name: 'Active Products',
      value: stats.activeProducts,
      icon: Eye,
      color: 'text-green-400',
      bgColor: 'bg-green-600',
    },
    {
      name: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingBag,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600',
    },
    {
      name: 'Revenue',
      value: `${stats.revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl shadow-lg overflow-hidden
                     hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="p-6 relative z-10">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${item.bgColor} rounded-full p-3 group-hover:bg-opacity-80 transition-colors duration-300`}>
                <item.icon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {item.name}
                </dt>
                <dd className={`mt-1 text-3xl font-bold text-white ${item.color} group-hover:text-opacity-90 transition-colors duration-300`}>
                  {item.value}
                </dd>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
