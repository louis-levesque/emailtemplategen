import type { PricingKey, PromoConfig } from '../types';

export const PRICING_LABELS: Record<PricingKey, string> = {
  monthlyNoCommitment: 'Monthly, no commitment',
  monthlyAnnual: 'Monthly, 1-year commitment',
  annualTotal: 'Annual, paid upfront',
};

/** Strip '$', commas, '/mo', '/yr' and return the numeric value */
export function parsePrice(str: string): number {
  const match = str.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ''));
}

/** Apply a PromoConfig to a price string and return the discounted amount */
export function applyPromo(originalStr: string, promo: PromoConfig): number {
  const original = parsePrice(originalStr);
  const discounted =
    promo.type === 'percent'
      ? original * (1 - promo.value / 100)
      : original - promo.value;
  return Math.round(discounted * 100) / 100;
}

/** Format a number as a currency string, keeping cents only when non-integer */
export function formatCurrency(value: number): string {
  if (Number.isInteger(value)) return '$' + value.toLocaleString();
  return '$' + value.toFixed(2);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Format an ISO date string (YYYY-MM-DD) as "Month Dth YYYY", e.g. "July 10th 2026" */
export function formatValidUntil(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${getOrdinal(day)} ${year}`;
}

/** Convert a month count to a human-readable duration */
export function formatDuration(months: number): string {
  if (months === 12) return '1 year';
  if (months % 12 === 0) return `${months / 12} years`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/** Build the promotional sentence that appears in the email */
export function buildPromoSentence(
  pricingKey: PricingKey,
  planTitle: string,
  originalStr: string,
  promo: PromoConfig,
): string {
  const discounted = applyPromo(originalStr, promo);
  const discStr = formatCurrency(discounted);
  const origStr = formatCurrency(parsePrice(originalStr));
  const promoLabel =
    promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`;
  const dur = formatDuration(promo.durationMonths);
  const label = PRICING_LABELS[pricingKey];

  if (pricingKey === 'annualTotal') {
    const monthlyDisc = Math.round((discounted / 12) * 100) / 100;
    const monthlyStr = formatCurrency(monthlyDisc);
    return (
      `For ${dur}, get ${promoLabel} off the ${planTitle} Annual, Paid Upfront Subscription Plan: ` +
      `${discStr}/year (${monthlyStr} x 12)`
    );
  }

  // Monthly variants and annualMonthly
  const unit = 'month';
  return (
    `For the first ${dur}, get ${promoLabel} off the ${planTitle} ${label} Subscription Plan: ` +
    `${discStr}/${unit} and ${origStr}/${unit} after`
  );
}

/** Same as buildPromoSentence but for a standalone add-on price */
export function buildAddonPromoSentence(
  addonName: string,
  originalStr: string,
  promo: PromoConfig,
): string {
  const discounted = applyPromo(originalStr, promo);
  const discStr = formatCurrency(discounted);
  const origStr = formatCurrency(parsePrice(originalStr));
  const promoLabel =
    promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`;
  const dur = formatDuration(promo.durationMonths);
  return (
    `For the first ${dur}, get ${promoLabel} off ${addonName}: ` +
    `${discStr}/month and ${origStr}/month after`
  );
}
