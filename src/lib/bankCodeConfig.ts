export interface BankCodeConfig {
  countryName: string;
  flagEmoji: string;
  fieldLabel: string;
  codeType: string;
  placeholder: string;
  validationRule?: RegExp;
  minLength?: number;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'decimal';
  autoComplete?: string;
  errorMessage: string;
  badgeDisplay: string;
}

export const BANK_CODE_CONFIGS: Record<string, BankCodeConfig> = {
  IN: {
    countryName: "India",
    flagEmoji: "🇮🇳",
    fieldLabel: "IFSC Code",
    codeType: "IFSC Code",
    placeholder: "Enter your 11-character IFSC Code (e.g., SBIN0001234)",
    validationRule: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
    minLength: 11,
    maxLength: 11,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid 11-character IFSC Code (e.g., SBIN0001234)",
    badgeDisplay: "🇮🇳 India — IFSC Code",
  },
  US: {
    countryName: "United States",
    flagEmoji: "🇺🇸",
    fieldLabel: "Routing Number",
    codeType: "ABA Routing Number",
    placeholder: "Enter your 9-digit ABA Routing Number",
    validationRule: /^\d{9}$/,
    minLength: 9,
    maxLength: 9,
    inputMode: "numeric",
    autoComplete: "off",
    errorMessage: "Please enter a valid 9-digit ABA Routing Number",
    badgeDisplay: "🇺🇸 United States — Routing Number",
  },
  GB: {
    countryName: "United Kingdom",
    flagEmoji: "🇬🇧",
    fieldLabel: "Sort Code",
    codeType: "Sort Code",
    placeholder: "Enter 6-digit Sort Code (e.g., 12-34-56 or 123456)",
    validationRule: /^(\d{2}-?\d{2}-?\d{2}|\d{6})$/,
    minLength: 6,
    maxLength: 8,
    inputMode: "numeric",
    autoComplete: "off",
    errorMessage: "Please enter a valid 6-digit Sort Code",
    badgeDisplay: "🇬🇧 United Kingdom — Sort Code",
  },
  CA: {
    countryName: "Canada",
    flagEmoji: "🇨🇦",
    fieldLabel: "Transit / Branch Number",
    codeType: "Transit & Institution Number",
    placeholder: "Enter Transit (5 digits) & Institution Number (3 digits)",
    validationRule: /^(\d{8,9}|\d{5}-\d{3})$/,
    minLength: 8,
    maxLength: 9,
    inputMode: "numeric",
    autoComplete: "off",
    errorMessage: "Please enter a valid Canadian Transit & Institution Number (8-9 digits)",
    badgeDisplay: "🇨🇦 Canada — Transit Number",
  },
  AU: {
    countryName: "Australia",
    flagEmoji: "🇦🇺",
    fieldLabel: "BSB Number",
    codeType: "BSB Code",
    placeholder: "Enter 6-digit BSB Code (e.g., 123-456 or 123456)",
    validationRule: /^(\d{3}-?\d{3}|\d{6})$/,
    minLength: 6,
    maxLength: 7,
    inputMode: "numeric",
    autoComplete: "off",
    errorMessage: "Please enter a valid 6-digit BSB Code",
    badgeDisplay: "🇦🇺 Australia — BSB Code",
  },
  DE: {
    countryName: "Germany",
    flagEmoji: "🇩🇪",
    fieldLabel: "BIC / SWIFT Code",
    codeType: "BIC / SWIFT Code",
    placeholder: "Enter 8 or 11 character BIC/SWIFT Code",
    validationRule: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
    minLength: 8,
    maxLength: 11,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid 8 or 11-character BIC/SWIFT Code",
    badgeDisplay: "🇩🇪 Germany — BIC / SWIFT Code",
  },
  FR: {
    countryName: "France",
    flagEmoji: "🇫🇷",
    fieldLabel: "BIC / SWIFT Code",
    codeType: "BIC / SWIFT Code",
    placeholder: "Enter 8 or 11 character BIC/SWIFT Code",
    validationRule: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
    minLength: 8,
    maxLength: 11,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid 8 or 11-character BIC/SWIFT Code",
    badgeDisplay: "🇫🇷 France — BIC / SWIFT Code",
  },
  MX: {
    countryName: "Mexico",
    flagEmoji: "🇲🇽",
    fieldLabel: "CLABE Number",
    codeType: "CLABE Number",
    placeholder: "Enter 18-digit CLABE Number",
    validationRule: /^\d{18}$/,
    minLength: 18,
    maxLength: 18,
    inputMode: "numeric",
    autoComplete: "off",
    errorMessage: "Please enter a valid 18-digit CLABE Number",
    badgeDisplay: "🇲🇽 Mexico — CLABE Number",
  },
  BR: {
    countryName: "Brazil",
    flagEmoji: "🇧🇷",
    fieldLabel: "Agency / ISPB Code",
    codeType: "Agency / ISPB Code",
    placeholder: "Enter Bank Agency Number or ISPB Code",
    validationRule: /^[A-Z0-9\-\s]{3,10}$/i,
    minLength: 3,
    maxLength: 10,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid Bank / Agency Code",
    badgeDisplay: "🇧🇷 Brazil — Agency Code",
  },
  JP: {
    countryName: "Japan",
    flagEmoji: "🇯🇵",
    fieldLabel: "Zengin Branch Code",
    codeType: "Branch Code",
    placeholder: "Enter 3-digit Branch Code or SWIFT",
    validationRule: /^[A-Z0-9]{3,11}$/i,
    minLength: 3,
    maxLength: 11,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid Branch Code or SWIFT",
    badgeDisplay: "🇯🇵 Japan — Zengin / Branch Code",
  },
};

export function getBankCodeConfig(countryCode?: string): BankCodeConfig {
  const code = (countryCode || 'US').toUpperCase().trim();
  if (BANK_CODE_CONFIGS[code]) {
    return BANK_CODE_CONFIGS[code];
  }

  // Graceful fallback for any other country
  return {
    countryName: countryCode || "Global",
    flagEmoji: "🌐",
    fieldLabel: "Bank / SWIFT Code",
    codeType: "Bank Identification Code",
    placeholder: "Enter your bank identification code",
    validationRule: /^[A-Z0-9\-\s]{3,20}$/i,
    minLength: 3,
    maxLength: 20,
    inputMode: "text",
    autoComplete: "off",
    errorMessage: "Please enter a valid bank code",
    badgeDisplay: `🌐 ${countryCode || 'Global'} — Bank Identification Code`,
  };
}
