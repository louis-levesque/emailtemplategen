import type { AppState, CanvasBlock, PlanBlock, AddonBlock, TextBlock, HeadingBlock, CheckoutLinkBlock, CompareBlock, CompareSlot, PlanDefinition, AddonDefinition } from '../types';
import {
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
  const align = block.alignment ?? 'left';
  const isHtml = /<[a-z][\s\S]*>/i.test(block.content);
  const processedContent = isHtml ? block.content : processTextContent(block.content);
  return `<div style="${SECTION_STYLE} text-align:${align};"><p style="margin:0;">${processedContent}</p></div>`;
}

function renderHeadingBlock(block: HeadingBlock): string {
  if (!block.text.trim()) return '';
  const align = block.alignment ?? 'center';
  return `<div style="${SECTION_STYLE}"><h2 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:26px; font-weight:800; color:#1D2D44; line-height:1.2; text-align:${align};">${escapeHtml(block.text)}</h2></div>`;
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

/**
 * Renders a single pricing option/tier as a "Recommended" featured box —
 * a fine Jobber dark-blue border with "Recommended" centered on the top edge.
 */
function renderFeaturedPricingBox(
  label: string,
  priceHtml: string,
): string {
  const borderColor = '#1D2D44';
  return `
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin:8px 0 4px;">
  <tr>
    <td style="width:30%; border-bottom:1px solid ${borderColor}; padding:0; font-size:0; line-height:0;"></td>
    <td style="padding:0 10px 3px; white-space:nowrap; text-align:center; vertical-align:bottom; font-size:11px; font-weight:700; color:${borderColor}; font-family:Arial,Helvetica,sans-serif; letter-spacing:0.04em;">Recommended</td>
    <td style="width:30%; border-bottom:1px solid ${borderColor}; padding:0; font-size:0; line-height:0;"></td>
  </tr>
  <tr>
    <td colspan="3" style="padding:0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-left:1px solid ${borderColor}; border-right:1px solid ${borderColor}; border-bottom:1px solid ${borderColor}; border-radius:0 0 6px 6px;">
        <tr>
          <td style="padding:7px 12px; color:#555; font-size:13px;">${label}</td>
          <td style="padding:7px 12px; text-align:right; font-size:13px;">${priceHtml}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function renderPlanBlock(block: PlanBlock, plans: PlanDefinition[]): string {
  const def = plans.find(p => p.id === block.definitionId);
  if (!def) return '';
  const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
  const featureRows = buildFeatureRows(def.features, block.visibleFeatureIds, block.keyFeatureIds ?? []);
  const hasFeatures = featureRows.length > 0;

  const seatLabel = `${tier.seats} ${tier.seats === 1 ? 'user seat' : 'user seats'}`;
  const visiblePricingOptionIds = block.visiblePricingOptionIds ?? def.pricingOptions.map(o => o.id);
  const promotions = block.promotions ?? {};

  // Build pricing rows — only for visible options
  // Featured option is pulled out as a standalone "Recommended" box; others go in the table.
  const featuredOptId = block.featuredPricingOptionId;
  let featuredPricingBox = '';
  const pricingRows = def.pricingOptions
    .filter(opt => visiblePricingOptionIds.includes(opt.id))
    .map(opt => {
      const priceEntry = tier.prices[opt.id];
      const original = priceEntry?.price ?? '$0/mo';
      const monthlyEquivalent = priceEntry?.monthlyEquivalent;
      const promo = promotions[opt.id];
      const label = opt.label;
      const isFeatured = featuredOptId === opt.id;

      if (promo) {
        const discounted = applyPromo(original, promo);
        const discStr = formatCurrency(discounted);
        const unit = original.includes('/yr') ? '/yr' : '/mo';
        const monthlyDisc = monthlyEquivalent
          ? formatCurrency(Math.round((discounted / 12) * 100) / 100)
          : null;

        const priceHtml = `<span style="text-decoration:line-through;color:#aaa;margin-right:6px;">${original}</span><strong style="color:#b45309;">${discStr}${unit}</strong>${monthlyDisc ? `<span style="display:block;font-size:11px;color:#b45309;">(${monthlyDisc}/mo)</span>` : ''}<span style="display:block;font-size:11px;color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${original}</span>`;

        if (isFeatured) {
          featuredPricingBox += renderFeaturedPricingBox(label, priceHtml);
          return '';
        }

        return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; font-size: 13px;">${priceHtml}</td>
    </tr>`;
      }

      const priceHtml = `<strong style="color:${def.color};">${original}</strong>${monthlyEquivalent ? `<span style="display:block;font-size:11px;font-weight:normal;color:#888;">(${monthlyEquivalent})</span>` : ''}`;

      if (isFeatured) {
        featuredPricingBox += renderFeaturedPricingBox(label, priceHtml);
        return '';
      }

      return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; font-weight: bold; color: ${def.color}; font-size: 13px;">
        ${original}
        ${monthlyEquivalent ? `<span style="display:block; font-size:11px; font-weight:normal; color:#888;">(${monthlyEquivalent})</span>` : ''}
      </td>
    </tr>`;
    })
    .join('');

  const recommendedBadge = block.isRecommended
    ? `<span style="display:inline-block;background-color:#ecfccb;color:#4d7c0f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;margin-left:6px;vertical-align:middle;">Recommended</span>`
    : '';

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #9DC63F; border-radius: 4px;">
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${def.color};margin-right:6px;vertical-align:middle;"></span>
        <strong style="font-size: 15px; color: #111; vertical-align: middle;">${def.title}</strong>${recommendedBadge}
      </td>
    </tr>
    <tr>
      <td style="padding: 6px 14px; background-color: #f9fafb; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; font-size: 12px; color: #555;">
        <strong>User seats:</strong> <span style="color: ${def.color}; font-weight: bold;">${seatLabel}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 6px 14px 8px; color: #555; font-size: 13px; border-bottom: 1px solid #f0f0f0;">${processTextContent(def.tagline)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 14px;">
        ${featuredPricingBox}
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

  const visibleTierIds = block.visibleTierIds ?? def.tiers.map(t => t.id);
  const promotions = block.promotions ?? {};
  const visibleTiers = def.tiers.filter(t => visibleTierIds.includes(t.id));

  const featuredAddonTierId = block.featuredTierId;
  let featuredAddonBox = '';
  const pricingRows = visibleTiers.map(tier => {
    const promo = promotions[tier.id];
    const unit = tier.price.includes('/yr') ? '/yr' : '/mo';
    const isFeatured = featuredAddonTierId === tier.id;

    if (promo) {
      const discounted = applyPromo(tier.price, promo);
      const discStr = formatCurrency(discounted);
      const monthlyDisc = tier.monthlyEquivalent ? formatCurrency(Math.round((discounted / 12) * 100) / 100) : null;
      const priceHtml = `<span style="text-decoration:line-through;color:#aaa;margin-right:6px;">${escapeHtml(tier.price)}</span><strong style="color:#b45309;">${escapeHtml(discStr)}${unit}</strong>${monthlyDisc ? `<span style="display:block;font-size:11px;color:#b45309;">(${escapeHtml(monthlyDisc)}/mo)</span>` : ''}<span style="display:block;font-size:11px;color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${escapeHtml(tier.price)}</span>`;

      if (isFeatured) {
        featuredAddonBox += renderFeaturedPricingBox(escapeHtml(tier.label), priceHtml);
        return '';
      }

      return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${escapeHtml(tier.label)}</td>
      <td style="padding: 4px 0; text-align: right; font-size: 13px;">${priceHtml}</td>
    </tr>`;
    }

    const priceHtml = `<strong style="color:#9DC63F;">${escapeHtml(tier.price)}</strong>${tier.monthlyEquivalent ? `<span style="display:block;font-size:11px;font-weight:normal;color:#888;">${escapeHtml(tier.monthlyEquivalent)}</span>` : ''}`;

    if (isFeatured) {
      featuredAddonBox += renderFeaturedPricingBox(escapeHtml(tier.label), priceHtml);
      return '';
    }

    return `
    <tr>
      <td style="padding: 4px 0; color: #555; font-size: 13px;">${escapeHtml(tier.label)}</td>
      <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #9DC63F; font-size: 13px;">
        ${escapeHtml(tier.price)}
        ${tier.monthlyEquivalent ? `<span style="display:block; font-size:11px; font-weight:normal; color:#888;">${escapeHtml(tier.monthlyEquivalent)}</span>` : ''}
      </td>
    </tr>`;
  }).join('');

  const addonRecommendedBadge = block.isRecommended
    ? `<span style="display:inline-block;background-color:#ecfccb;color:#4d7c0f;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;margin-left:6px;vertical-align:middle;">Recommended</span>`
    : '';

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #9DC63F; border-radius: 4px;">
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <strong style="font-size: 15px; color: #111;">${def.name}</strong>${addonRecommendedBadge}
      </td>
    </tr>
    <tr>
      <td style="padding: 4px 14px 8px; color: #555; font-size: 13px; border-bottom: 1px solid #f0f0f0;">${processTextContent(def.description)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 14px;">
        ${featuredAddonBox}
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

function renderCompareSlotCell(slot: CompareSlot, plans: PlanDefinition[], addons: AddonDefinition[], anyRecommended = false): string {
  if (slot.kind === 'plan') {
    const def = plans.find(p => p.id === slot.definitionId);
    if (!def) return '';
    const tier = def.tiers.find(t => t.seats === slot.selectedSeats) ?? def.tiers[0];
    const visiblePricingOptionIds = slot.visiblePricingOptionIds ?? def.pricingOptions.map(o => o.id);
    const promotions = slot.promotions ?? {};

    // All visible pricing rows
    const pricingRows = def.pricingOptions
      .filter(opt => visiblePricingOptionIds.includes(opt.id))
      .map(opt => {
        const priceEntry = tier.prices[opt.id];
        const original = priceEntry?.price ?? '$0/mo';
        const monthlyEquivalent = priceEntry?.monthlyEquivalent;
        const promo = promotions[opt.id];
        const label = opt.label;

        if (promo) {
          const discounted = applyPromo(original, promo);
          const discStr = formatCurrency(discounted);
          const unit = original.includes('/yr') ? '/yr' : '/mo';
          const monthlyDisc = monthlyEquivalent ? formatCurrency(Math.round((discounted / 12) * 100) / 100) : null;
          return `<div style="padding:3px 0 6px;">
            <div style="font-size:10px; color:#888;">${escapeHtml(label)}</div>
            <div style="font-size:11px;"><span style="text-decoration:line-through;color:#aaa;">${escapeHtml(original)}</span> <strong style="color:#b45309;">${escapeHtml(discStr)}${escapeHtml(unit)}</strong>${monthlyDisc ? ` <span style="font-size:10px; color:#b45309;">(${escapeHtml(monthlyDisc)}/mo)</span>` : ''}</div>
            <div style="font-size:10px;color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${escapeHtml(original)}</div>
          </div>`;
        }

        return `<div style="padding:3px 0 6px;">
          <div style="font-size:10px; color:#888;">${escapeHtml(label)}</div>
          <div style="font-size:11px; font-weight:bold; color:${def.color};">${escapeHtml(original)}${monthlyEquivalent ? ` <span style="font-size:10px; font-weight:normal; color:#888;">(${escapeHtml(monthlyEquivalent)})</span>` : ''}</div>
        </div>`;
      })
      .join('');

    const promoValidUntilHtml = slot.promoValidUntil && Object.keys(promotions).length > 0
      ? `<div style="font-size:10px; color:#92400e; margin-top:4px;">Promo valid until ${formatValidUntil(slot.promoValidUntil)}.</div>`
      : '';

    const featureRows = buildCompareFeatureRows(def.features, slot.visibleFeatureIds, slot.keyFeatureIds);
    const seatLabel = `${tier.seats} ${tier.seats === 1 ? 'user seat' : 'user seats'}`;

    const planSlotRecommendedRow = anyRecommended
      ? `<tr><td style="padding:4px 10px; background-color:${slot.isRecommended ? '#ecfccb' : '#f3f4f6'}; text-align:center; font-size:10px; font-weight:600; color:${slot.isRecommended ? '#4d7c0f' : '#f3f4f6'}; letter-spacing:0.03em;">${slot.isRecommended ? 'Recommended' : '&nbsp;'}</td></tr>`
      : '';

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${planSlotRecommendedRow}
        <tr>
          <td style="padding:8px 10px; background-color:#f9fafb;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${def.color};margin-right:5px;vertical-align:middle;"></span>
            <strong style="font-size:13px; color:#111; vertical-align:middle;">${escapeHtml(def.title)}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 10px; background-color:#f9fafb; border-top:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; font-size:11px; color:#555;">
            <strong>User seats:</strong> <span style="color:${def.color}; font-weight:bold;">${seatLabel}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:3px 10px 6px; color:#555; font-size:12px;">${escapeHtml(stripLinkSyntax(def.tagline))}</td>
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
      </table>`;
  }

  // addon
  const def = addons.find(a => a.id === slot.definitionId);
  if (!def) return '';

  const visibleTierIds = slot.visibleTierIds ?? def.tiers.map(t => t.id);
  const slotPromotions = slot.promotions ?? {};
  const visibleTiers = def.tiers.filter(t => visibleTierIds.includes(t.id));

  const addonPricingRows = visibleTiers.map(tier => {
    const promo = slotPromotions[tier.id];
    if (promo) {
      const discounted = applyPromo(tier.price, promo);
      const discStr = formatCurrency(discounted);
      const unit = tier.price.includes('/yr') ? '/yr' : '/mo';
      return `<div style="padding:3px 0 6px;">
        <div style="font-size:10px; color:#888;">${escapeHtml(tier.label)}</div>
        <div style="font-size:11px;"><span style="text-decoration:line-through;color:#aaa;">${escapeHtml(tier.price)}</span> <strong style="color:#b45309;">${escapeHtml(discStr)}${unit}</strong></div>
        <div style="font-size:10px;color:#888;">${promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} off for ${promo.durationMonths} mo, then ${escapeHtml(tier.price)}</div>
      </div>`;
    }
    return `<div style="padding:3px 0 6px;">
      <div style="font-size:10px; color:#888;">${escapeHtml(tier.label)}</div>
      <div style="font-size:11px; font-weight:bold; color:#9DC63F;">${escapeHtml(tier.price)}${tier.monthlyEquivalent ? ` <span style="font-size:10px; font-weight:normal; color:#888;">${escapeHtml(tier.monthlyEquivalent)}</span>` : ''}</div>
    </div>`;
  }).join('');

  const promoValidUntilHtml = Object.keys(slotPromotions).length > 0 && slot.promoValidUntil
    ? `<div style="font-size:10px; color:#92400e; margin-top:2px;">Promo valid until ${formatValidUntil(slot.promoValidUntil)}.</div>`
    : '';

  const featureRows = buildCompareFeatureRows(def.features, slot.visibleFeatureIds, slot.keyFeatureIds);

  const addonSlotRecommendedRow = anyRecommended
    ? `<tr><td style="padding:4px 10px; background-color:${slot.isRecommended ? '#ecfccb' : '#f3f4f6'}; text-align:center; font-size:10px; font-weight:600; color:${slot.isRecommended ? '#4d7c0f' : '#f3f4f6'}; letter-spacing:0.03em;">${slot.isRecommended ? 'Recommended' : '&nbsp;'}</td></tr>`
    : '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${addonSlotRecommendedRow}
      <tr>
        <td style="padding:8px 10px; background-color:#f9fafb;">
          <strong style="font-size:13px; color:#111;">${escapeHtml(def.name)}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:3px 10px 6px; color:#555; font-size:12px;">${escapeHtml(stripLinkSyntax(def.description))}</td>
      </tr>
      ${addonPricingRows || promoValidUntilHtml ? `
      <tr>
        <td style="padding:6px 10px; border-bottom:1px solid #f0f0f0;">
          ${addonPricingRows}
          ${promoValidUntilHtml}
        </td>
      </tr>` : ''}
      ${featureRows ? `
      <tr>
        <td style="padding:6px 10px 10px; border-top:1px solid #f0f0f0;">
          ${featureRows}
        </td>
      </tr>` : ''}
    </table>`;
}

function renderCompareBlock(block: CompareBlock, plans: PlanDefinition[], addons: AddonDefinition[]): string {
  const filledSlots = block.slots.filter((s): s is CompareSlot => s !== null);
  if (filledSlots.length === 0) return '';

  const anyRecommended = filledSlots.some(s => s.isRecommended);
  const slotWidth = Math.floor(100 / filledSlots.length);

  const cells = filledSlots
    .map((slot, i) => {
      const innerTable = renderCompareSlotCell(slot, plans, addons, anyRecommended);
      const spacer = i < filledSlots.length - 1
        ? `\n      <td style="width:12px; padding:0;"></td>`
        : '';
      return `<td style="vertical-align:top; width:${slotWidth}%; border:1px solid #e5e7eb; border-left:4px solid #9DC63F; border-radius:4px; overflow:hidden; padding:0;">${innerTable}</td>${spacer}`;
    })
    .join('\n      ');

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
    case 'heading': return renderHeadingBlock(block);
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
      case 'text': {
        const isHtml = /<[a-z][\s\S]*>/i.test(block.content);
        if (isHtml) {
          return block.content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        }
        return block.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
      }
      case 'heading':
        return block.text;
      case 'plan': {
        const def = plans.find(p => p.id === block.definitionId);
        if (!def) return '';
        const tier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
        const visiblePricingOptionIds = block.visiblePricingOptionIds ?? def.pricingOptions.map(o => o.id);
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
        const pricing = def.pricingOptions
          .filter(opt => visiblePricingOptionIds.includes(opt.id))
          .map(opt => {
            const priceEntry = tier.prices[opt.id];
            const original = priceEntry?.price ?? '$0/mo';
            const monthlyEquivalent = priceEntry?.monthlyEquivalent;
            const promo = promotions[opt.id];
            if (promo) {
              const discounted = applyPromo(original, promo);
              const unit = original.includes('/yr') ? '/yr' : '/mo';
              const promoLbl = promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`;
              return `  ${opt.label}: ${formatCurrency(discounted)}${unit} (${promoLbl} off for ${promo.durationMonths} mo, then ${original})`;
            }
            if (monthlyEquivalent) {
              return `  ${opt.label}: ${original} (${monthlyEquivalent})`;
            }
            return `  ${opt.label}: ${original}`;
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
        const addonPromotions = block.promotions ?? {};
        const addonVisibleTierIds = block.visibleTierIds ?? def.tiers.map(t => t.id);
        const visibleTiers = def.tiers.filter(t => addonVisibleTierIds.includes(t.id));
        const pricing = visibleTiers
          .map(tier => {
            const promo = addonPromotions[tier.id];
            if (promo) {
              const promoLbl = promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`;
              const unit = tier.price.includes('/yr') ? '/yr' : '/mo';
              return `  ${tier.label}: ${formatCurrency(applyPromo(tier.price, promo))}${unit} (${promoLbl} off for ${promo.durationMonths} mo, then ${tier.price})`;
            }
            return `  ${tier.label}: ${tier.price}${tier.monthlyEquivalent ? ` ${tier.monthlyEquivalent}` : ''}`;
          })
          .join('\n');
        const validUntilAddon = Object.keys(addonPromotions).length > 0 && block.promoValidUntil
          ? `Promotional pricing valid until ${formatValidUntil(block.promoValidUntil)}.`
          : '';
        return [def.name, stripLinkSyntax(def.description), pricing, validUntilAddon, features].filter(Boolean).join('\n');
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
