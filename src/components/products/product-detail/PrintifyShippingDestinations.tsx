'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Globe, CheckCircle2, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { printifyAPI } from '@/lib/api';

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
  REST_OF_THE_WORLD: { name: "Worldwide Shipping", flag: "🌍" },
};

function getCountryFlag(code: string): string {
  if (COUNTRY_MAP[code]?.flag) return COUNTRY_MAP[code].flag;
  if (code.length === 2) {
    try {
      const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }
  return '🌐';
}

function getCountryName(code: string): string {
  if (COUNTRY_MAP[code]?.name) return COUNTRY_MAP[code].name;
  if (code.length === 2) {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(code.toUpperCase()) || code;
    } catch {
      return code;
    }
  }
  return code;
}

export function PrintifyShippingDestinations({
  product,
  selectedVariant,
}: PrintifyShippingDestinationsProps) {
  const [fetchedRegions, setFetchedRegions] = useState<string[] | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Extract explicit regions from variant or product
  const explicitRegions = useMemo(() => {
    const set = new Set<string>();

    const processItem = (val: any) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((r) => typeof r === 'string' && set.add(r.toUpperCase().trim()));
      } else if (typeof val === 'object') {
        Object.keys(val).forEach((k) => set.add(k.toUpperCase().trim()));
      } else if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          processItem(parsed);
        } catch {
          val.split(',').forEach(r => r.trim() && set.add(r.toUpperCase().trim()));
        }
      }
    };

    processItem(selectedVariant?.availability_regions);
    processItem(selectedVariant?.printify_availability_regions);
    processItem(product?.availability_regions);
    processItem(product?.printify_availability_regions);

    return Array.from(set);
  }, [selectedVariant, product]);

  // Fetch blueprint shipping profiles dynamically if explicit regions are not present
  useEffect(() => {
    if (explicitRegions.length > 0) return;

    const blueprintId = product?.blueprint_id || product?.printify_blueprint_id;
    const providerId = product?.print_provider_id || product?.printify_print_provider_id;

    if (!blueprintId || !providerId) return;

    let isMounted = true;
    setLoadingProfiles(true);

    printifyAPI.getShippingProfiles(blueprintId, providerId)
      .then((data: any) => {
        if (!isMounted) return;
        const profiles = data?.profiles || [];
        const detected = new Set<string>();

        profiles.forEach((p: any) => {
          if (Array.isArray(p.countries)) {
            p.countries.forEach((c: string) => detected.add(c.toUpperCase().trim()));
          }
        });

        if (detected.size > 0) {
          setFetchedRegions(Array.from(detected));
        }
      })
      .catch((err: any) => {
        console.warn('Failed to fetch product shipping profiles:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingProfiles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [explicitRegions, product]);

  const activeRegions = explicitRegions.length > 0 ? explicitRegions : (fetchedRegions || ['US']);

  const isUSOnly = useMemo(() => {
    return activeRegions.length > 0 && activeRegions.every(r => r === 'US' || r === 'USA');
  }, [activeRegions]);

  const isWorldwide = useMemo(() => {
    return activeRegions.some(r => r === 'WORLDWIDE' || r === 'GLOBAL' || r === 'REST_OF_THE_WORLD');
  }, [activeRegions]);

  const destinations = useMemo(() => {
    const list: { code: string; name: string; flag: string }[] = [];
    const seen = new Set<string>();

    activeRegions.forEach((code) => {
      const upper = code.toUpperCase().trim();
      if (seen.has(upper)) return;
      seen.add(upper);

      list.push({
        code: upper,
        name: getCountryName(upper),
        flag: getCountryFlag(upper),
      });
    });

    return list;
  }, [activeRegions]);

  return (
    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              Available Shipping Countries
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-400">
              {isUSOnly
                ? "Fulfillment available within the United States"
                : isWorldwide
                ? "Global Direct Fulfillment (Worldwide)"
                : "Selected Regional Fulfillment"}
            </p>
          </div>
        </div>

        {isUSOnly ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <MapPin className="w-3.5 h-3.5" /> Ships to US Only 🇺🇸
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Direct Express Shipping
          </span>
        )}
      </div>

      {/* Country Badges Grid */}
      <div className="flex flex-wrap gap-2 mb-3">
        {destinations.map((dest) => (
          <div
            key={dest.code}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/15 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-gray-200 transition-all duration-200"
          >
            <span className="text-base leading-none">{dest.flag}</span>
            <span>{dest.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Notice Banner for US-Only or Restricted Delivery */}
      {isUSOnly && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-200 font-semibold">US Shipping Only:</strong> This item is produced by a US fulfillment center and cannot be shipped to international destinations (such as India, the UK, Europe, etc.). Orders placed with an address outside the United States cannot be fulfilled.
          </p>
        </div>
      )}

      {/* Footer Info Note */}
      <div className="flex items-start gap-2 pt-2 text-[11px] sm:text-xs text-gray-400">
        <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Orders are custom-printed and dispatched from verified fulfillment centers. Real-time delivery availability and exact rates are verified during checkout based on your shipping address.
        </p>
      </div>
    </div>
  );
}
