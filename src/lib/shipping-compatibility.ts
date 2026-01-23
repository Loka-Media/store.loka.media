export interface CartItem {
  id: number;
  product_name: string;
  availability_regions?: string[];
  printful_availability_regions?: string[];
  printful_variant_id?: string;
  source?: string;
}

export interface IncompatibleItem {
  item: CartItem;
  availableRegions: string[];
  requestedRegion: string;
}

export interface PrintfulCountry {
  name: string;
  code: string;
  region: string;
  states: any[] | null;
}

export const checkShippingCompatibility = (
  items: CartItem[],
  countryCode: string,
  countries: PrintfulCountry[]
): IncompatibleItem[] => {
  if (!countryCode || !countries) return [];

  const selectedCountry = countries.find(c => c.code === countryCode);
  if (!selectedCountry) return [];

  const incompatibleItems: IncompatibleItem[] = [];

  for (const item of items) {
    if (item.source !== 'printful' && !item.printful_variant_id) {
      continue;
    }

    const availabilityRegions = item.printful_availability_regions || item.availability_regions;

    if (availabilityRegions && Array.isArray(availabilityRegions)) {
      const isCompatible = checkRegionCompatibility(
        availabilityRegions,
        countryCode,
        selectedCountry.region,
        countries
      );

      if (!isCompatible) {
        incompatibleItems.push({
          item,
          availableRegions: availabilityRegions,
          requestedRegion: countryCode,
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
  countries: PrintfulCountry[]
): boolean => {
  if (availableRegions.includes(countryCode)) {
    return true;
  }

  if (availableRegions.includes('worldwide')) {
    return true;
  }

  if (availableRegions.includes('EU') && countryRegion === 'europe') {
    return true;
  }

  if (availableRegions.includes('UK') && countryCode === 'GB') {
    return true;
  }

  return false;
};

export const getRegionName = (regionCode: string, countries: PrintfulCountry[]): string => {
  const country = countries.find(c => c.code === regionCode);
  if (country) {
    return country.name;
  }

  if (regionCode === 'UK') {
    const uk = countries.find(c => c.code === 'GB');
    if (uk) return uk.name;
  }

  if (regionCode === 'EU') {
    return 'Europe';
  }

  if (regionCode === 'worldwide') {
    return 'Worldwide';
  }

  return regionCode;
};

export const formatIncompatibilityMessage = (
  incompatibleItems: IncompatibleItem[],
  countries: PrintfulCountry[]
): string => {
  if (incompatibleItems.length === 0) return '';

  if (incompatibleItems.length === 1) {
    const item = incompatibleItems[0];
    const regions = item.availableRegions
      .map(r => getRegionName(r, countries))
      .join(', ');
    return `"${item.item.product_name}" can only ship to: ${regions}`;
  }

  return `${incompatibleItems.length} items in your cart cannot ship to the selected region. Please remove them to continue.`;
};
