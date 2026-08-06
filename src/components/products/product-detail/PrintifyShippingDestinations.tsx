'use client';

import { Truck, Globe, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

interface PrintifyShippingDestinationsProps {
  product: any;
  selectedVariant?: any;
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  US: { name: "United States", flag: "🇺🇸" },
  USA: { name: "United States", flag: "🇺🇸" },
  CA: { name: "Canada", flag: "🇨🇦" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  UK: { name: "United Kingdom", flag: "🇬🇧" },
  EU: { name: "European Union", flag: "🇪🇺" },
  EUROPE: { name: "European Union", flag: "🇪🇺" },
  AU: { name: "Australia & NZ", flag: "🇦🇺" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  IN: { name: "India", flag: "🇮🇳" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  ES: { name: "Spain", flag: "🇪🇸" },
  IT: { name: "Italy", flag: "🇮🇹" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  SE: { name: "Sweden", flag: "🇸🇪" },
  JP: { name: "Japan", flag: "🇯🇵" },
  WORLDWIDE: { name: "Worldwide Shipping", flag: "🌍" },
  GLOBAL: { name: "Worldwide Shipping", flag: "🌍" },
};

export function PrintifyShippingDestinations({
  product,
  selectedVariant,
}: PrintifyShippingDestinationsProps) {
  const getDestinations = () => {
    const regionsSet = new Set<string>();

    const processItem = (val: any) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((r) => typeof r === 'string' && regionsSet.add(r.toUpperCase().trim()));
      } else if (typeof val === 'object') {
        Object.keys(val).forEach((k) => regionsSet.add(k.toUpperCase().trim()));
      } else if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          processItem(parsed);
        } catch {
          regionsSet.add(val.toUpperCase().trim());
        }
      }
    };

    processItem(selectedVariant?.availability_regions);
    processItem(selectedVariant?.printify_availability_regions);
    processItem(product?.availability_regions);
    processItem(product?.printify_availability_regions);

    // Default global Printify destinations if none explicitly specified
    if (regionsSet.size === 0) {
      return [
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "CA", name: "Canada", flag: "🇨🇦" },
        { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
        { code: "EU", name: "European Union", flag: "🇪🇺" },
        { code: "AU", name: "Australia & NZ", flag: "🇦🇺" },
        { code: "WORLDWIDE", name: "Worldwide Shipping", flag: "🌍" },
      ];
    }

    const list: { code: string; name: string; flag: string }[] = [];
    regionsSet.forEach((code) => {
      const info = COUNTRY_MAP[code] || { name: code, flag: "🌐" };
      list.push({ code, name: info.name, flag: info.flag });
    });

    return list;
  };

  const destinations = getDestinations();

  return (
    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              Available Shipping Countries
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-400">
              Printify Direct Global Fulfillment
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Direct Express Shipping
        </span>
      </div>

      {/* Country Badges Grid */}
      <div className="flex flex-wrap gap-2 mb-3">
        {destinations.map((dest) => (
          <div
            key={dest.code}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/15 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-gray-200 transition-all duration-200"
          >
            <span className="text-base leading-none">{dest.flag}</span>
            <span>{dest.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Footer Info Note */}
      <div className="flex items-start gap-2 pt-2 text-[11px] sm:text-xs text-gray-400">
        <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Orders are custom-printed and dispatched from the nearest fulfillment center to ensure fast delivery & lower shipping rates.
        </p>
      </div>
    </div>
  );
}
