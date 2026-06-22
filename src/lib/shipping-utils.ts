import { ShippingProfile } from './api';

export const REST_OF_WORLD_CODE = 'REST_OF_THE_WORLD';

export interface RegionalMapping {
  code: string;
  name: string;
  isRestOfWorld: boolean;
}

// Fallback manual map for common countries if Intl.DisplayNames is not fully supported or we want specific overrides
const MANUAL_COUNTRY_MAP: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'UK': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'EU': 'Europe', // Some providers use EU as a block
  'MX': 'Mexico',
  'JP': 'Japan',
};

/**
 * Extracts unique countries from shipping profiles and maps them to human-readable names.
 */
export function getUniqueRegionsFromProfiles(profiles: ShippingProfile[]): RegionalMapping[] {
  if (!profiles || profiles.length === 0) return [];

  const uniqueCodes = new Set<string>();

  profiles.forEach(profile => {
    if (profile.countries && Array.isArray(profile.countries)) {
      profile.countries.forEach(countryCode => {
        uniqueCodes.add(countryCode.toUpperCase());
      });
    }
  });

  const regions: RegionalMapping[] = [];
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

  uniqueCodes.forEach(code => {
    if (code === REST_OF_WORLD_CODE) {
      regions.push({
        code,
        name: 'Rest of World',
        isRestOfWorld: true
      });
    } else {
      let name = code;
      // Try manual overrides first
      if (MANUAL_COUNTRY_MAP[code]) {
        name = MANUAL_COUNTRY_MAP[code];
      } else {
        try {
          const intlName = displayNames.of(code);
          if (intlName) name = intlName;
        } catch (e) {
          // Fallback to raw code if Intl fails
        }
      }

      regions.push({
        code,
        name,
        isRestOfWorld: false
      });
    }
  });

  // Sort: US first, then alphabetical, Rest of World last
  return regions.sort((a, b) => {
    if (a.code === 'US') return -1;
    if (b.code === 'US') return 1;
    if (a.isRestOfWorld) return 1;
    if (b.isRestOfWorld) return -1;
    return a.name.localeCompare(b.name);
  });
}
