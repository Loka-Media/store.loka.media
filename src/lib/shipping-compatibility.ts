export interface CartItem {
  id: number;
  product_name: string;
  availability_regions?: string[] | string | any;
  printify_availability_regions?: string[] | string | any;
  source?: string;
  [key: string]: any;
}

export interface IncompatibleItem {
  item: CartItem;
  availableRegions: string[];
  requestedRegion: string;
}

export interface ShippingCountry {
  name: string;
  code: string;
  region: string;
  states: any[] | null;
}

export const checkShippingCompatibility = (
  items: CartItem[],
  countryCode: string,
  countries: ShippingCountry[]
): IncompatibleItem[] => {
  if (!countryCode || !countries || !Array.isArray(items) || items.length === 0) return [];

  const targetCountry = countryCode.toUpperCase().trim();
  const selectedCountry = countries.find(c => c.code.toUpperCase() === targetCountry);
  const countryRegion = selectedCountry?.region || '';

  const incompatibleItems: IncompatibleItem[] = [];

  for (const item of items) {
    // Only skip Printful items (which have their own regional routing)
    if (item.source === 'printful' || (item as any).printful_variant_id) {
      continue;
    }

    let regions: string[] = [];
    const rawRegions = item.printify_availability_regions 
      || item.availability_regions 
      || (item as any).regions;

    if (rawRegions) {
      if (Array.isArray(rawRegions)) {
        regions = rawRegions.map(r => String(r).toUpperCase().trim());
      } else if (typeof rawRegions === 'string') {
        try {
          const parsed = JSON.parse(rawRegions);
          if (Array.isArray(parsed)) {
            regions = parsed.map(r => String(r).toUpperCase().trim());
          } else if (typeof parsed === 'object' && parsed !== null) {
            regions = Object.keys(parsed).map(k => k.toUpperCase().trim());
          } else {
            regions = [rawRegions.toUpperCase().trim()];
          }
        } catch {
          regions = rawRegions.split(',').map(r => r.toUpperCase().trim()).filter(Boolean);
        }
      } else if (typeof rawRegions === 'object' && rawRegions !== null) {
        regions = Object.keys(rawRegions).map(k => k.toUpperCase().trim());
      }
    }

    if (regions.length > 0) {
      const isCompatible = checkRegionCompatibility(
        regions,
        targetCountry,
        countryRegion,
        countries
      );

      if (!isCompatible) {
        incompatibleItems.push({
          item,
          availableRegions: regions,
          requestedRegion: targetCountry,
        });
      }
    }
  }

  return incompatibleItems;
};

const checkRegionCompatibility = (
  availableRegions: string[],
  countryCode: string,
  countryRegion: string,
  countries: ShippingCountry[]
): boolean => {
  const norm = availableRegions.map(r => r.toUpperCase().trim());
  const cc = countryCode.toUpperCase().trim();

  if (norm.includes(cc)) return true;
  if (norm.includes('WORLDWIDE') || norm.includes('GLOBAL') || norm.includes('REST_OF_THE_WORLD') || norm.includes('ALL')) return true;
  if ((norm.includes('EU') || norm.includes('EUROPE')) && (countryRegion.toLowerCase() === 'europe' || countryRegion.toUpperCase() === 'EU')) return true;
  if ((norm.includes('UK') || norm.includes('GB')) && (cc === 'GB' || cc === 'UK')) return true;
  if ((norm.includes('US') || norm.includes('USA')) && (cc === 'US' || cc === 'USA')) return true;
  if ((norm.includes('CA') || norm.includes('CAN')) && (cc === 'CA' || cc === 'CAN')) return true;
  if ((norm.includes('AU') || norm.includes('AUS')) && (cc === 'AU' || cc === 'AUS')) return true;
  if (norm.includes('IN') && cc === 'IN') return true;

  return false;
};

export const getRegionName = (regionCode: string, countries: ShippingCountry[]): string => {
  const normalized = regionCode.toUpperCase().trim();
  const country = countries.find(c => c.code.toUpperCase() === normalized);
  if (country) {
    return country.name;
  }

  if (normalized === 'UK' || normalized === 'GB') {
    return 'United Kingdom';
  }

  if (normalized === 'US' || normalized === 'USA') {
    return 'United States';
  }

  if (normalized === 'CA' || normalized === 'CAN') {
    return 'Canada';
  }

  if (normalized === 'AU' || normalized === 'AUS') {
    return 'Australia';
  }

  if (normalized === 'IN') {
    return 'India';
  }

  if (normalized === 'EU' || normalized === 'EUROPE') {
    return 'European Union';
  }

  if (normalized === 'WORLDWIDE' || normalized === 'GLOBAL' || normalized === 'REST_OF_THE_WORLD') {
    return 'Worldwide';
  }

  return regionCode;
};

export const formatIncompatibilityMessage = (
  incompatibleItems: IncompatibleItem[],
  countries: ShippingCountry[]
): string => {
  if (incompatibleItems.length === 0) return '';

  if (incompatibleItems.length === 1) {
    const item = incompatibleItems[0];
    const regions = item.availableRegions
      .map(r => getRegionName(r, countries))
      .join(', ');
    const reqCountry = getRegionName(item.requestedRegion, countries) || item.requestedRegion;
    return `"${item.item.product_name}" is only available for shipping to: ${regions}. Delivery to ${reqCountry} is not available.`;
  }

  return `${incompatibleItems.length} items in your cart cannot be shipped to the selected country. Please remove them to proceed.`;
};
