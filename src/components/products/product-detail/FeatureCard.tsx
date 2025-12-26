'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import StartShape from '@/components/ui/StartShape';

interface FeatureCardProps {
  icon?: LucideIcon;
  iconSvg?: ReactNode;
  color: 'pink' | 'orange' | 'green';
  title: string;
  subtitle: string;
}

const colorMap = {
  pink: 'text-pink-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
};

export function FeatureCard({ icon: Icon, iconSvg, color, title, subtitle }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      <StartShape className="w-20 h-20 sm:w-32 sm:h-32">
        <div className="flex items-center justify-center h-full">
          {iconSvg ? (
            <div className="w-8 h-8 sm:w-16 sm:h-16">
              {iconSvg}
            </div>
          ) : Icon ? (
            <Icon className={`w-8 h-8 sm:w-16 sm:h-16 ${colorMap[color]}`} />
          ) : null}
        </div>
      </StartShape>
      <div className="text-center">
        <p className={`text-xs sm:text-base font-bold ${colorMap[color]}`}>{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
