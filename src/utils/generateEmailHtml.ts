import type { AppState, CanvasBlock, PlanBlock, AddonBlock, TextBlock, CheckoutLinkBlock, CompareBlock, CompareSlot, PlanDefinition, AddonDefinition } from '../types';
import { ALL_PRICING_KEYS } from '../types';
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
function processTextContent(raw: string, linkColor = '#1F9839'): string {
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
      `<a href="${linkUrl}" target="_blank" style="color: ${linkColor}; text-decoration: underline;">${linkText}</a>`
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push(escapeHtml(raw.slice(lastIndex)));
  }

  return parts.join('').replace(/\n/g, '<br>');
}

/** Strip [display text](url) link syntax, leaving just the display text. */
export function stripLinkSyntax(raw: string): string {
  return raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function renderTextBlock(block: TextBlock): string {
  const processed = processTextContent(block.content);
  return `<div style="${SECTION_STYLE}"><p style="margin:0;">${processed}</p></div>`;
}

function buildFeatureRows(
  allFeatures: { id: string; label: string }[],
  visibleFeatureIds: string[],
  keyFeatureIds: string[],
): string {
  const keyFeatures = allFeatures.filter(f => keyFeatureIds.includes(f.id) && visibleFeatureIds.includes(f.id));
  const otherFeatures = allFeatures.filter(f => visibleFeatureIds.includes(f.id) && !keyFeatureIds.includes(f.id));

  if (keyFeatures.length === 0 && otherFeatures.length === 0) return '';

  let rows = '';

  if (keyFeatures.length > 0) {
    rows += `<tr><td style="padding: 6px 0 4px; font-size: 11px; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 0.06em;">Key Features</td></tr>`;
    rows += keyFeatures.map(f =>
      `<tr><td style="padding: 3px 0 3px 8px; font-weight: 600; color: #222;">&#9733; ${processTextContent(f.label)}</td></tr>`
    ).join('');
  }

  if (otherFeatures.length > 0) {
    if (keyFeatures.length > 0) {
      rows += `<tr><td style="padding: 10px 0 4px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.06em;">Other features included</td></tr>`;
    }
    rows += otherFeatures.map(f =>
      `<tr><td style="padding: 3px 0 3px 8px; color: #444;">&#10003; ${processTextContent(f.label)}</td></tr>`
    ).join('');
  }

  return rows;
}

function renderPlanBlock(block: PlanBlock, plans: PlanDefinition[]): string {
  const def = plans.find(p => p.id === block.definitionId);
  if (!def) return '';
  const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
  const featureRows = buildFeatureRows(def.features, block.visibleFeatureIds, block.keyFeatureIds ?? []);
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
        <span style="display:block; font-size:11px; color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${original}</span>
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

  const recommendedRow = block.isRecommended
    ? `<tr><td style="padding: 5px 14px; background-color: #ecfccb; text-align: center; font-size: 11px; font-weight: 600; color: #4d7c0f; letter-spacing: 0.03em;">Recommended</td></tr>`
    : '';

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #9DC63F; border-radius: 4px;">
    ${recommendedRow}
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${def.color};margin-right:6px;vertical-align:middle;"></span>
        <strong style="font-size: 15px; color: #111; vertical-align: middle;">${def.title}</strong>
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 14px 8px; color: #555; font-size: 13px;">${processTextContent(def.tagline)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 14px; background-color: #f9fafb; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; font-size: 12px; color: #555;">
        <strong>User seats:</strong> <span style="color: ${def.color}; font-weight: bold;">${seatLabel}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 14px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${pricingRows}
        </table>
        ${block.promoValidUntil && Object.keys(promotions).length > 0 ? `<p style="margin: 6px 0 0; font-size: 11px; color: #92400e;">Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.</p>` : ''}
      </td>
    </tr>
    ${hasFeatures ? `
    <tr>
      <td style="padding: 8px 14px 12px; border-top: 1px solid #f0f0f0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRows}
        </table>
      </td>
    </tr>` : ''}
  </table>
</div>`;
}

function renderAddonBlock(block: AddonBlock, addons: AddonDefinition[]): string {
  const def = addons.find(a => a.id === block.definitionId);
  if (!def) return '';
  const featureRows = buildFeatureRows(def.features, block.visibleFeatureIds, block.keyFeatureIds ?? []);
  const hasFeatures = featureRows.length > 0;

  const promo = block.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;
  const promoLabel = promo ? (promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`) : '';

  const headerPriceHtml = discounted !== null
    ? `<span style="text-decoration:line-through;color:#aaa;font-size:12px;margin-right:4px;">${def.price}</span><strong style="color:#b45309;font-size:14px;">${formatCurrency(discounted)}/mo</strong><span style="display:block;font-size:11px;color:#888;text-align:right;">${promoLabel} off for ${promo!.durationMonths} mo, then ${def.price}</span>`
    : `<strong style="color:#1D2D44;font-size:14px;">${def.price}</strong>`;

  const addonRecommendedRow = block.isRecommended
    ? `<tr><td style="padding: 5px 14px; background-color: #ecfccb; text-align: center; font-size: 11px; font-weight: 600; color: #4d7c0f; letter-spacing: 0.03em;">Recommended</td></tr>`
    : '';

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #9DC63F; border-radius: 4px;">
    ${addonRecommendedRow}
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <strong style="font-size: 15px; color: #111;">${def.name}</strong>
            </td>
            <td style="text-align: right; vertical-align: middle; white-space: nowrap; padding-left: 8px;">
              ${headerPriceHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 14px 8px; color: #555; font-size: 13px;">${processTextContent(def.description)}</td>
    </tr>
    ${promo && block.promoValidUntil ? `
    <tr>
      <td style="padding: 4px 14px 6px;">
        <p style="margin: 0; font-size: 11px; color: #92400e;">Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.</p>
      </td>
    </tr>` : ''}
    ${hasFeatures ? `
    <tr>
      <td style="padding: 8px 14px 12px; border-top: 1px solid #f0f0f0;">
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
        <a href="${block.url}" target="_blank" style="display: inline-block; background-color: #9DC63F; color: #1D2D44; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px;">Preview Checkout Page</a>
      </td>
    </tr>
  </table>
</div>`;
}

/**
 * Compact feature list for a compare slot cell.
 * Key features get bold checkmarks under a "Key Features" label;
 * other included features get regular checkmarks.
 */
function buildCompareFeatureRows(
  allFeatures: { id: string; label: string }[],
  visibleFeatureIds: string[],
  keyFeatureIds: string[],
): string {
  const keyFeatures = allFeatures.filter(f => keyFeatureIds.includes(f.id) && visibleFeatureIds.includes(f.id));
  const otherFeatures = allFeatures.filter(f => visibleFeatureIds.includes(f.id) && !keyFeatureIds.includes(f.id));

  if (keyFeatures.length === 0 && otherFeatures.length === 0) return '';

  let html = '';

  if (keyFeatures.length > 0) {
    html += `<div style="font-size:10px; font-weight:bold; color:#d97706; text-transform:uppercase; letter-spacing:0.05em; padding:2px 0 3px;">Key Features</div>`;
    html += keyFeatures.map(f =>
      `<div style="font-size:12px; color:#222; font-weight:600; padding:2px 0;">&#9733; ${escapeHtml(stripLinkSyntax(f.label))}</div>`
    ).join('');
  }

  if (otherFeatures.length > 0) {
    if (keyFeatures.length > 0) {
      html += `<div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.05em; padding:4px 0 3px;">Other features</div>`;
    }
    html += otherFeatures.map(f =>
      `<div style="font-size:12px; color:#555; padding:2px 0;">&#10003; ${escapeHtml(stripLinkSyntax(f.label))}</div>`
    ).join('');
  }

  return html;
}

function renderCompareSlotCell(slot: CompareSlot, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  if (slot.kind === 'plan') {
    const def = plans.find(p => p.id === slot.definitionId);
    if (!def) return '';
    const tier = def.tiers.find(t => t.seats === slot.selectedSeats) ?? def.tiers[0];
    const visiblePricingKeys = slot.visiblePricingKeys ?? ALL_PRICING_KEYS;
    const promotions = slot.promotions ?? {};

    // All visible pricing rows
    const pricingRows = ALL_PRICING_KEYS
      .filter(key => visiblePricingKeys.includes(key))
      .map(key => {
        const original = tier[key];
        const promo = promotions[key];
        const label = PRICING_LABELS[key];
        const isAnnualTotal = key === 'annualTotal';

        if (promo) {
          const discounted = applyPromo(original, promo);
          const discStr = formatCurrency(discounted);
          const unit = original.includes('/yr') ? '/yr' : '/mo';
          const monthlyDisc = isAnnualTotal ? formatCurrency(Math.round((discounted / 12) * 100) / 100) : null;
          return `<div style="font-size:11px; color:#555; padding:1px 0;">${escapeHtml(label)}: <span style="text-decoration:line-through;color:#aaa;">${escapeHtml(original)}</span> <strong style="color:#b45309;">${escapeHtml(discStr)}${escapeHtml(unit)}</strong>${isAnnualTotal && monthlyDisc ? ` <span style="color:#b45309;">(${escapeHtml(monthlyDisc)}/mo)</span>` : ''}<span style="display:block;font-size:10px;color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${escapeHtml(original)}</span></div>`;
        }

        return `<div style="font-size:11px; color:#555; padding:1px 0;">${escapeHtml(label)}: <strong style="color:${def.color};">${escapeHtml(original)}</strong>${isAnnualTotal ? ` <span style="color:#888;">(${escapeHtml(tier.annualMonthly)})</span>` : ''}</div>`;
      })
      .join('');

    const promoValidUntilHtml = slot.promoValidUntil && Object.keys(promotions).length > 0
      ? `<div style="font-size:10px; color:#92400e; margin-top:4px;">Promo valid until ${formatValidUntil(slot.promoValidUntil)}.</div>`
      : '';

    const featureRows = buildCompareFeatureRows(def.features, slot.visibleFeatureIds, slot.keyFeatureIds);
    const seatLabel = `${tier.seats} ${tier.seats === 1 ? 'user seat' : 'user seats'}`;

    const planSlotRecommendedRow = slot.isRecommended
      ? `<tr><td style="padding:4px 10px; background-color:#ecfccb; text-align:center; font-size:10px; font-weight:600; color:#4d7c0f; letter-spacing:0.03em;">Recommended</td></tr>`
      : '';

    return `
      <td style="vertical-align:top; padding:0 6px; width:${Math.floor(100 / 3)}%;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-left:4px solid #9DC63F; border-radius:4px;">
          ${planSlotRecommendedRow}
          <tr>
            <td style="padding:8px 10px; background-color:#f9fafb;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${def.color};margin-right:5px;vertical-align:middle;"></span>
              <strong style="font-size:13px; color:#111; vertical-align:middle;">${escapeHtml(def.title)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:3px 10px 6px; color:#555; font-size:12px;">${escapeHtml(stripLinkSyntax(def.tagline))}</td>
          </tr>
          <tr>
            <td style="padding:4px 10px; background-color:#f9fafb; border-top:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; font-size:11px; color:#555;">
              <strong>User seats:</strong> <span style="color:${def.color}; font-weight:bold;">${seatLabel}</span>
            </td>
          </tr>
          ${pricingRows || promoValidUntilHtml ? `
          <tr>
            <td style="padding:6px 10px; border-bottom:1px solid #f0f0f0;">
              ${pricingRows}
              ${promoValidUntilHtml}
            </td>
          </tr>` : ''}
          ${featureRows ? `
          <tr>
            <td style="padding:8px 10px;">
              ${featureRows}
            </td>
          </tr>` : ''}
        </table>
      </td>`;
  }

  // addon
  const def = addons.find(a => a.id === slot.definitionId);
  if (!def) return '';

  const promo = slot.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;
  const promoLabel = promo ? (promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`) : '';
  const headerPriceHtml = discounted !== null
    ? `<span style="text-decoration:line-through;color:#aaa;font-size:11px;">${escapeHtml(def.price)}</span> <strong style="color:#b45309;font-size:12px;">${escapeHtml(formatCurrency(discounted))}/mo</strong><span style="display:block;font-size:10px;color:#888;text-align:right;">${escapeHtml(promoLabel)} off for ${promo!.durationMonths} mo, then ${escapeHtml(def.price)}</span>`
    : `<strong style="color:#1D2D44;font-size:12px;">${escapeHtml(def.price)}</strong>`;

  const promoValidUntilHtml = promo && slot.promoValidUntil
    ? `<div style="font-size:10px; color:#92400e; margin-top:2px;">Promo valid until ${formatValidUntil(slot.promoValidUntil)}.</div>`
    : '';

  const featureRows = buildCompareFeatureRows(def.features, slot.visibleFeatureIds, slot.keyFeatureIds);

  const addonSlotRecommendedRow = slot.isRecommended
    ? `<tr><td style="padding:4px 10px; background-color:#ecfccb; text-align:center; font-size:10px; font-weight:600; color:#4d7c0f; letter-spacing:0.03em;">Recommended</td></tr>`
    : '';

  return `
    <td style="vertical-align:top; padding:0 6px; width:${Math.floor(100 / 3)}%;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-left:4px solid #9DC63F; border-radius:4px;">
        ${addonSlotRecommendedRow}
        <tr>
          <td style="padding:8px 10px; background-color:#f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <strong style="font-size:13px; color:#111;">${escapeHtml(def.name)}</strong>
                </td>
                <td style="text-align:right; vertical-align:middle; padding-left:6px; white-space:nowrap;">
                  ${headerPriceHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:3px 10px 6px; color:#555; font-size:12px;">${escapeHtml(stripLinkSyntax(def.description))}</td>
        </tr>
        ${promoValidUntilHtml ? `
        <tr>
          <td style="padding:2px 10px 4px;">
            ${promoValidUntilHtml}
          </td>
        </tr>` : ''}
        ${featureRows ? `
        <tr>
          <td style="padding:6px 10px 10px; border-top:1px solid #f0f0f0;">
            ${featureRows}
          </td>
        </tr>` : ''}
      </table>
    </td>`;
}

function renderCompareBlock(block: CompareBlock, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  const filledSlots = block.slots.filter((s): s is CompareSlot => s !== null);
  if (filledSlots.length === 0) return '';

  const cells = filledSlots
    .map(slot => renderCompareSlotCell(slot, plans, addons))
    .join('');

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      ${cells}
    </tr>
  </table>
</div>`;
}

function renderBlock(block: CanvasBlock, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  switch (block.kind) {
    case 'text': return renderTextBlock(block);
    case 'plan': return renderPlanBlock(block, plans);
    case 'addon': return renderAddonBlock(block, addons);
    case 'signature': return renderSignatureBlock();
    case 'checkout': return renderCheckoutLinkBlock(block);
    case 'compare': return renderCompareBlock(block, plans, addons);
  }
}

export function generateEmailHtml(state: AppState, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  const body = state.blocks.map(b => renderBlock(b, plans, addons)).join('\n');
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

export function generateEmailText(state: AppState, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  return state.blocks.map(block => {
    switch (block.kind) {
      case 'text':
        // Convert [text](url) links to "text (url)" for plain text
        return block.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
      case 'plan': {
        const def = plans.find(p => p.id === block.definitionId);
        if (!def) return '';
        const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
        const visiblePricingKeys = block.visiblePricingKeys ?? ALL_PRICING_KEYS;
        const promotions = block.promotions ?? {};
        const keyIds = block.keyFeatureIds ?? [];
        const keyFeaturesText = def.features
          .filter(f => keyIds.includes(f.id) && block.visibleFeatureIds.includes(f.id))
          .map(f => `  ★ ${stripLinkSyntax(f.label)}`)
          .join('\n');
        const otherFeaturesText = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id) && !keyIds.includes(f.id))
          .map(f => `  ✓ ${stripLinkSyntax(f.label)}`)
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
              const promoLbl = promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`;
              return `  ${PRICING_LABELS[key]}: ${formatCurrency(discounted)}${unit} (${promoLbl} off for ${promo.durationMonths} mo, then ${tier[key]})`;
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
          `${def.title} (${tier.seats} ${tier.seats === 1 ? 'user' : 'users'}) — ${stripLinkSyntax(def.tagline)}`,
          pricing,
          validUntilPlan,
          features,
        ].filter(Boolean).join('\n');
      }
      case 'addon': {
        const def = addons.find(a => a.id === block.definitionId);
        if (!def) return '';
        const addonKeyIds = block.keyFeatureIds ?? [];
        const addonKeyText = def.features
          .filter(f => addonKeyIds.includes(f.id) && block.visibleFeatureIds.includes(f.id))
          .map(f => `  ★ ${stripLinkSyntax(f.label)}`)
          .join('\n');
        const addonOtherText = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id) && !addonKeyIds.includes(f.id))
          .map(f => `  ✓ ${stripLinkSyntax(f.label)}`)
          .join('\n');
        const features = [
          addonKeyText ? `Key Features:\n${addonKeyText}` : '',
          addonOtherText ? (addonKeyText ? `Other features included:\n${addonOtherText}` : addonOtherText) : '',
        ].filter(Boolean).join('\n');
        const promo = block.promo ?? null;
        const priceLine = promo
          ? `${def.name} — ${formatCurrency(applyPromo(def.price, promo))}/mo (${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${def.price})`
          : `${def.name} — ${def.price}`;
        const validUntilAddon = promo && block.promoValidUntil
          ? `Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.`
          : '';
        return [priceLine, stripLinkSyntax(def.description), validUntilAddon, features].filter(Boolean).join('\n');
      }
      case 'signature':
        return '{{{Sender.Email_Signature_Rich_Text__c}}}';
      case 'checkout':
        return block.url ? `Preview Checkout Page: ${block.url}` : '';
      case 'compare': {
        const names = block.slots
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map(slot => {
            if (slot.kind === 'plan') {
              const def = plans.find(p => p.id === slot.definitionId);
              return def ? def.title : '';
            } else {
              const def = addons.find(a => a.id === slot.definitionId);
              return def ? def.name : '';
            }
          })
          .filter(Boolean);
        return `--- Compare ---\n${names.join(' | ')}`;
      }
    }
  }).join('\n\n');
}
