/**
 * Unified Pricing Utility for Loka Media Storefront & Creator Studio
 * Ensures uniform .99 psychological pricing across Canvas and Storefront.
 */

/**
 * Calculates the final customer retail price using Base Cost + Markup Amount with uniform .99 rounding.
 * e.g., Base $10.99 + Markup $4.00 = $14.99
 */
export function calculateFinalRetailPrice(baseCost: number, markupAmount: number): number {
  const cost = Number(baseCost) || 0;
  const markup = Number(markupAmount) || 0;
  const rawPrice = cost + markup;
  if (rawPrice <= 0) return 0;
  return Math.max(0, Math.ceil(rawPrice) - 0.01);
}

/**
 * Calculates the final customer retail price using Loka Base Cost and Creator Markup Percentage.
 * e.g., Base $10.99 with 36% Markup = $14.99
 */
export function calculateRetailPriceFromMarkup(lokaBaseCost: number, markupPercentage: number): number {
  const cost = Number(lokaBaseCost) || 0;
  const markup = Number(markupPercentage) || 0;
  if (cost <= 0) return 0;
  const rawPrice = cost * (1 + markup / 100);
  return Math.max(0, Math.ceil(rawPrice) - 0.01);
}

/**
 * Ensures uniform .99 psychological pricing on any input price.
 * - If already ends in .99 (e.g., 14.99), retains it exactly.
 * - If flat round decimal (e.g. 14.00, resulting from Math.round or legacy DB records), converts to 14.99.
 * - If arbitrary float (e.g. 14.35), applies standard Ceil-0.01 to produce 14.99.
 */
export function ensure99Pricing(price: number | string | null | undefined): number {
  if (price === null || price === undefined) return 0;
  const num = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (isNaN(num) || num <= 0) return 0;

  // Check cents
  const cents = Math.round(num * 100);
  if (cents % 100 === 99) {
    return num;
  }

  // Handle flat integers or near-zero cents like 14.00
  const whole = Math.floor(num);
  const decimalPart = num - whole;
  if (decimalPart < 0.05) {
    return Number((whole + 0.99).toFixed(2));
  }

  return Math.max(0, Math.ceil(num) - 0.01);
}
