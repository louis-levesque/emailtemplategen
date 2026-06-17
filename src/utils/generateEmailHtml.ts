import type { AppState, CanvasBlock, PlanBlock, AddonBlock, TextBlock, CheckoutLinkBlock } from '../types';
import { ALL_PRICING_KEYS } from '../types';
import { PLANS } from '../data/plans';
import { ADDONS } from '../data/addons';
import {
  PRICING_LABELS,
  applyPromo,
  formatCurrency,
  buildPromoSentence,
  buildAddonPromoSentence,
} from './priceUtils';

const OUTER_STYLE = 'font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;';
const CONTAINER_STYLE = 'max-width: 600px; margin: 0 auto;';
const SECTION_STYLE = 'margin-bottom: 20px;';

function renderTextBlock(block: TextBlock): string {
  const escaped = block.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `<div style="${SECTION_STYLE}"><p style="margin:0;">${escaped}</p></div>`;
}

function renderPlanBlock(block: PlanBlock): string {
  const def = PLANS.find(p => p.id === block.definitionId);
  if (!def) return '';
  const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
  const visibleFeatures = def.features.filter(f => block.visibleFeatureIds.includes(f.id));
  const featureRows = visibleFeatures
    .map(f => `<tr><td style="padding: 4px 0; padding-left: 8px;">✓ ${f.label}</td></tr>`)
    .join('');

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
        ${isAnnualTotal && monthlyDisc ? `<span style="display:block; font-size:11px; color:#b45309;">(${monthlyDisc} × 12)</span>` : ''}
        <span style="display:block; font-size:11px; color:#888;">first ${promo.durationMonths} month${promo.durationMonths !== 1 ? 's' : ''}, then ${original}</span>
      </td>
    </tr>`;
      }

      return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; font-weight: bold; color: ${def.color}; font-size: 13px;">${original}</td>
    </tr>`;
    })
    .join('');

  // Promo sentences for visible keys that have a promo
  const promoSentences = ALL_PRICING_KEYS
    .filter(key => visiblePricingKeys.includes(key) && promotions[key])
    .map(key => buildPromoSentence(key, def.title, tier[key], promotions[key]!));

  const promoBlock = promoSentences.length > 0
    ? `
    <tr>
      <td style="padding: 10px 16px; background-color: #fffbeb; border-top: 1px solid #fde68a;">
        ${promoSentences.map(s =>
          `<p style="margin: 0 0 6px; font-size: 12px; color: #92400e;">${s}</p>`
        ).join('')}
      </td>
    </tr>`
    : '';

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
      </td>
    </tr>
    ${promoBlock}
    ${visibleFeatures.length > 0 ? `
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
  const visibleFeatures = def.features.filter(f => block.visibleFeatureIds.includes(f.id));
  const featureRows = visibleFeatures
    .map(f => `<tr><td style="padding: 3px 0; padding-left: 8px; color: #444;">✓ ${f.label}</td></tr>`)
    .join('');

  const promo = block.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;

  const priceDisplay = discounted !== null
    ? `<span style="text-decoration: line-through; color: #aaa; margin-right: 6px;">${def.price}</span><strong style="color: #b45309;">${formatCurrency(discounted)}/mo</strong>`
    : `<strong style="color: #1F9839;">${def.price}</strong>`;

  const promoSentence = promo
    ? `<tr><td style="padding: 6px 14px; background-color: #fffbeb; border-top: 1px solid #fde68a;">
        <p style="margin:0; font-size: 12px; color: #92400e;">${buildAddonPromoSentence(def.name, def.price, promo)}</p>
       </td></tr>`
    : '';

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
    ${promoSentence}
    ${visibleFeatures.length > 0 ? `
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
      case 'text': return block.content;
      case 'plan': {
        const def = PLANS.find(p => p.id === block.definitionId);
        if (!def) return '';
        const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
        const visiblePricingKeys = block.visiblePricingKeys ?? ALL_PRICING_KEYS;
        const promotions = block.promotions ?? {};
        const features = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        const pricing = ALL_PRICING_KEYS
          .filter(key => visiblePricingKeys.includes(key))
          .map(key => {
            const promo = promotions[key];
            if (promo) return `  ${buildPromoSentence(key, def.title, tier[key], promo)}`;
            return `  ${PRICING_LABELS[key]}: ${tier[key]}`;
          })
          .join('\n');
        return [
          `${def.title} (${tier.seats} ${tier.seats === 1 ? 'user' : 'users'}) — ${def.tagline}`,
          pricing,
          features,
        ].filter(Boolean).join('\n');
      }
      case 'addon': {
        const def = ADDONS.find(a => a.id === block.definitionId);
        if (!def) return '';
        const features = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        const promo = block.promo ?? null;
        const priceLine = promo
          ? buildAddonPromoSentence(def.name, def.price, promo)
          : `${def.name} — ${def.price}`;
        return `${priceLine}\n${def.description}\n${features}`;
      }
      case 'signature':
        return '{{{Sender.Email_Signature_Rich_Text__c}}}';
      case 'checkout':
        return block.url ? `Preview Checkout Page: ${block.url}` : '';
    }
  }).join('\n\n');
}
