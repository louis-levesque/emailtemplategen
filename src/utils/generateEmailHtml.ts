import type { AppState, CanvasBlock, PlanBlock, AddonBlock, TextBlock } from '../types';
import { PLANS } from '../data/plans';
import { ADDONS } from '../data/addons';

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
  const visibleFeatures = def.features.filter(f => block.visibleFeatureIds.includes(f.id));
  const featureRows = visibleFeatures
    .map(f => `<tr><td style="padding: 4px 0; padding-left: 8px;">✓ ${f.label}</td></tr>`)
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
      <td style="padding: 12px 16px; background-color: #f9f9f9;">
        <strong style="font-size: 20px; color: ${def.color};">${def.monthlyPrice}</strong>
        <span style="color: #666; font-size: 12px; margin-left: 8px;">${def.annualPrice}</span>
      </td>
    </tr>
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

  return `
<div style="${SECTION_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-left: 4px solid #1F9839; border-radius: 4px;">
    <tr>
      <td style="padding: 10px 14px; background-color: #f9fafb;">
        <strong style="font-size: 15px; color: #111;">${def.name}</strong>
        <span style="font-size: 13px; color: #1F9839; font-weight: bold; float: right;">${def.price}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 6px 14px 2px; color: #555; font-size: 13px;">${def.description}</td>
    </tr>
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

function renderBlock(block: CanvasBlock): string {
  switch (block.kind) {
    case 'text': return renderTextBlock(block);
    case 'plan': return renderPlanBlock(block);
    case 'addon': return renderAddonBlock(block);
    case 'signature': return renderSignatureBlock();
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
        const features = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        return `${def.title} — ${def.monthlyPrice}\n${def.tagline}\n${features}`;
      }
      case 'addon': {
        const def = ADDONS.find(a => a.id === block.definitionId);
        if (!def) return '';
        const features = def.features
          .filter(f => block.visibleFeatureIds.includes(f.id))
          .map(f => `  ✓ ${f.label}`)
          .join('\n');
        return `${def.name} — ${def.price}\n${def.description}\n${features}`;
      }
      case 'signature':
        return '{{{Sender.Email_Signature_Rich_Text__c}}}';
    }
  }).join('\n\n');
}
