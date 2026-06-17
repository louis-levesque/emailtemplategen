import type { AppState, CanvasBlock, PlanBlock, AddonBlock, TextBlock, CheckoutLinkBlock } from '../types';
import { ALL_PRICING_KEYS } from '../types';
import { PLANS } from '../data/plans';
import { ADDONS } from '../data/addons';
import {
  PRICING_LABELS,
  applyPromo,
  formatCurrency,
  formatValidUntil,
} from './priceUtils';

const OUTER_STYLE = 'font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;';
const CONTAINER_STYLE = 'max-width: 600px; margin: 0 auto;';
const SECTION_STYLE = 'margin-bottom: 20px;';

/** Escape HTML special characters in a plain-text segment. */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Convert raw text content to safe HTML:
 * - Escapes HTML in plain-text segments
 * - Converts [display text](url) to styled <a> links
 * - Converts newlines to <br>
 */
function processTextContent(raw: string): string {
  const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(raw.slice(lastIndex, match.index)));
    }
    const linkText = escapeHtml(match[1]);
    const linkUrl = match[2].replace(/"/g, '&quot;');
    parts.push(
      `<a href="${linkUrl}" target="_blank" style="color: #1F9839; text-decoration: underline;">${linkText}</a>`
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push(escapeHtml(raw.slice(lastIndex)));
  }

  return parts.join('').replace(/\n/g, '<br>');
}

function renderTextBlock(block: TextBlock): string {
  const processed = processTextContent(block.content);
  return `<div style="${SECTION_STYLE}"><p style="margin:0;">${processed}</p></div>`;
}

function buildFeatureRows(
  allFeatures: { id: string; label: string }[],
  visibleFeatureIds: string[],
  keyFeatureIds: string[],
  accentColor: string,
): string {
  const keyFeatures = allFeatures.filter(f => keyFeatureIds.includes(f.id) && visibleFeatureIds.includes(f.id));
  const otherFeatures = allFeatures.filter(f => visibleFeatureIds.includes(f.id) && !keyFeatureIds.includes(f.id));

  if (keyFeatures.length === 0 && otherFeatures.length === 0) return '';

  let rows = '';

  if (keyFeatures.length > 0) {
    rows += `<tr><td style="padding: 6px 0 4px; font-size: 11px; font-weight: bold; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.06em;">Key Features</td></tr>`;
    rows += keyFeatures.map(f =>
      `<tr><td style="padding: 3px 0 3px 8px; font-weight: 600; color: #222;">✓ ${f.label}</td></tr>`
    ).join('');
  }

  if (otherFeatures.length > 0) {
    if (keyFeatures.length > 0) {
      rows += `<tr><td style="padding: 10px 0 4px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.06em;">Other features included</td></tr>`;
    }
    rows += otherFeatures.map(f =>
      `<tr><td style="padding: 3px 0 3px 8px; color: #444;">✓ ${f.label}</td></tr>`
    ).join('');
  }

  return rows;
}

function renderPlanBlock(block: PlanBlock): string {
  const def = PLANS.find(p => p.id === block.definitionId);
  if (!def) return '';
  const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
  const featureRows = buildFeatureRows(def.features, block.visibleFeatureIds, block.keyFeatureIds ?? [], def.color);
  const hasFeatures = featureRows.length > 0;

  const seatLabel = `${tier.seats} ${tier.seats === 1 ? 'user seat' : 'user seats'}`;
  const visiblePricingKeys = block.visiblePricingKeys ?? ALL_PRICING_KEYS;
  const promotions = block.promotions ?? {};

  // Build pricing rows — only for visible keys
  const pricingRows = ALL_PRICING_KEYS
    .filter(key => visiblePricingKeys.includes(key))
    .map(key => {
      const original = tier[key];
      const promo = promotions[key];
      const label = PRICING_LABELS[key];

      if (promo) {
        const discounted = applyPromo(original, promo);
        const discStr = formatCurrency(discounted);
        const unit = original.includes('/yr') ? '/yr' : '/mo';
        const isAnnualTotal = key === 'annualTotal';
        const monthlyDisc = isAnnualTotal
          ? formatCurrency(Math.round((discounted / 12) * 100) / 100)
          : null;

        return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; font-size: 13px;">
        <span style="text-decoration: line-through; color: #aaa; margin-right: 6px;">${original}</span>
        <strong style="color: #b45309;">${discStr}${unit}</strong>
        ${isAnnualTotal && monthlyDisc ? `<span style="display:block; font-size:11px; color:#b45309;">(${monthlyDisc}/mo)</span>` : ''}
        <span style="display:block; font-size:11px; color:#888;">first ${promo.durationMonths} month${promo.durationMonths !== 1 ? 's' : ''}, then ${original}</span>
      </td>
    </tr>`;
      }

      const isAnnualTotal = key === 'annualTotal';
      return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; font-weight: bold; color: ${def.color}; font-size: 13px;">
        ${original}
        ${isAnnualTotal ? `<span style="display:block; font-size:11px; font-weight:normal; color:#888;">(${tier.annualMonthly})</span>` : ''}
      </td>
    </tr>`;
    })
    .join('');

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid ${def.color}; border-radius: 6px; overflow: hidden;">
    <tr>
      <td style="background-color: ${def.color}; padding: 12px 16px;">
        <strong style="color: #ffffff; font-size: 18px;">${def.title}</strong>
        <span style="color: rgba(255,255,255,0.85); font-size: 13px; display: block; margin-top: 2px;">${def.tagline}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 16px; background-color: #f9f9f9; border-bottom: 1px solid ${def.color}22;">
        <strong style="font-size: 13px; color: #555;">Included user seats: </strong>
        <span style="font-size: 13px; color: ${def.color}; font-weight: bold;">${seatLabel}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 16px; background-color: #f9f9f9;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${pricingRows}
        </table>
        ${block.promoValidUntil && Object.keys(promotions).length > 0 ? `<p style="margin: 8px 0 0; font-size: 11px; color: #92400e;">Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.</p>` : ''}
      </td>
    </tr>
    ${hasFeatures ? `
    <tr>
      <td style="padding: 12px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRows}
        </table>
      </td>
    </tr>` : ''}
  </table>
</div>`;
}

function renderAddonBlock(block: AddonBlock): string {
  const def = ADDONS.find(a => a.id === block.definitionId);
  if (!def) return '';
  const featureRows = buildFeatureRows(def.features, block.visibleFeatureIds, block.keyFeatureIds ?? [], '#1F9839');
  const hasFeatures = featureRows.length > 0;

  const promo = block.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;

  const priceDisplay = discounted !== null
    ? `<span style="text-decoration: line-through; color: #aaa; margin-right: 6px;">${def.price}</span><strong style="color: #b45309;">${formatCurrency(discounted)}/mo</strong>`
    : `<strong style="color: #1F9839;">${def.price}</strong>`;

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #1F9839; border-radius: 4px;">
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <strong style="font-size: 15px; color: #111;">${def.name}</strong>
        <span style="font-size: 13px; float: right;">${priceDisplay}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 6px 14px 2px; color: #555; font-size: 13px;">${def.description}</td>
    </tr>
    ${promo && block.promoValidUntil ? `
    <tr>
      <td style="padding: 4px 14px 2px;">
        <p style="margin: 0; font-size: 11px; color: #92400e;">Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.</p>
      </td>
    </tr>` : ''}
    ${hasFeatures ? `
    <tr>
      <td style="padding: 8px 14px 12px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRows}
        </table>
      </td>
    </tr>` : ''}
  </table>
</div>`;
}

function renderSignatureBlock(): string {
  return `<div style="${SECTION_STYLE}">{{{Sender.Email_Signature_Rich_Text__c}}}</div>`;
}

function renderCheckoutLinkBlock(block: CheckoutLinkBlock): string {
  if (!block.url) return '';
  return `
<div style="${SECTION_STYLE} text-align: center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 8px 0;">
        <a href="${block.url}" target="_blank" style="display: inline-block; background-color: #1F9839; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px;">Preview Checkout Page</a>
      </td>
    </tr>
  </table>
</div>`;
}

function renderBlock(block: CanvasBlock): string {
  switch (block.kind) {
    case 'text': return renderTextBlock(block);
    case 'plan': return renderPlanBlock(block);
    case 'addon': return renderAddonBlock(block);
    case 'signature': return renderSignatureBlock();
    case 'checkout': return renderCheckoutLinkBlock(block);
  }
}

export function generateEmailHtml(state: AppState): string {
  const body = state.blocks.map(renderBlock).join('\n');
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="${OUTER_STYLE}">
  <div style="${CONTAINER_STYLE}">
    ${body}
  </div>
</body>
</html>`;
}

export function generateEmailText(state: AppState): string {
  return state.blocks.map(block => {
    switch (block.kind) {
      case 'text':
        // Convert [text](url) links to "text (url)" for plain text
        return block.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
      case 'plan': {
        const def = PLANS.find(p => p.id === block.definitionId);
        if (!def) return '';
        const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
        const visiblePricingKeys = block.visiblePricingKeys ?? ALL_PRICING_KEYS;
        const promotions = block.promotions ?? {};
        const keyIds = block.keyFeatureIds ?? [];
        const keyFeaturesText = def.features
          .filter(f => keyIds.includes(f.id) && block.visibleFeatureIds.includes(f.id))
          .map(f => `  ★ ${f.label}`)
          .join('\n');
        const otherFeaturesText = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id) && !keyIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        const features = [
          keyFeaturesText ? `Key Features:\n${keyFeaturesText}` : '',
          otherFeaturesText ? (keyFeaturesText ? `Other features included:\n${otherFeaturesText}` : otherFeaturesText) : '',
        ].filter(Boolean).join('\n');
        const pricing = ALL_PRICING_KEYS
          .filter(key => visiblePricingKeys.includes(key))
          .map(key => {
            const promo = promotions[key];
            if (promo) {
              const discounted = applyPromo(tier[key], promo);
              const unit = tier[key].includes('/yr') ? '/yr' : '/mo';
              return `  ${PRICING_LABELS[key]}: ${formatCurrency(discounted)}${unit} (${promo.durationMonths} mo, then ${tier[key]})`;
            }
            if (key === 'annualTotal') {
              return `  ${PRICING_LABELS[key]}: ${tier[key]} (${tier.annualMonthly})`;
            }
            return `  ${PRICING_LABELS[key]}: ${tier[key]}`;
          })
          .join('\n');
        const validUntilPlan = block.promoValidUntil && Object.keys(promotions).length > 0
          ? `  Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.`
          : '';
        return [
          `${def.title} (${tier.seats} ${tier.seats === 1 ? 'user' : 'users'}) — ${def.tagline}`,
          pricing,
          validUntilPlan,
          features,
        ].filter(Boolean).join('\n');
      }
      case 'addon': {
        const def = ADDONS.find(a => a.id === block.definitionId);
        if (!def) return '';
        const addonKeyIds = block.keyFeatureIds ?? [];
        const addonKeyText = def.features
          .filter(f => addonKeyIds.includes(f.id) && block.visibleFeatureIds.includes(f.id))
          .map(f => `  ★ ${f.label}`)
          .join('\n');
        const addonOtherText = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id) && !addonKeyIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        const features = [
          addonKeyText ? `Key Features:\n${addonKeyText}` : '',
          addonOtherText ? (addonKeyText ? `Other features included:\n${addonOtherText}` : addonOtherText) : '',
        ].filter(Boolean).join('\n');
        const promo = block.promo ?? null;
        const priceLine = promo
          ? `${def.name} — ${formatCurrency(applyPromo(def.price, promo))}/mo (${promo.durationMonths} mo, then ${def.price})`
          : `${def.name} — ${def.price}`;
        const validUntilAddon = promo && block.promoValidUntil
          ? `Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.`
          : '';
        return [priceLine, def.description, validUntilAddon, features].filter(Boolean).join('\n');
      }
      case 'signature':
        return '{{{Sender.Email_Signature_Rich_Text__c}}}';
      case 'checkout':
        return block.url ? `Preview Checkout Page: ${block.url}` : '';
    }
  }).join('\n\n');
}
