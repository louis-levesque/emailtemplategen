export interface PlanFeature {
  id: string;
  label: string;
}

export interface PriceTier {
  seats: number;
  monthlyNoCommitment: string;
  monthlyAnnual: string;
  annualMonthly: string;
  annualTotal: string;
}

export interface PlanDefinition {
  id: string;
  title: string;
  tagline: string;
  tiers: PriceTier[];
  color: string;
  features: PlanFeature[];
}

export interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  price: string;
  features: PlanFeature[];
}

export type BlockKind = 'plan' | 'addon' | 'signature' | 'text' | 'checkout' | 'compare';

export type PricingKey = 'monthlyNoCommitment' | 'monthlyAnnual' | 'annualTotal';

export const ALL_PRICING_KEYS: PricingKey[] = [
  'monthlyNoCommitment',
  'monthlyAnnual',
  'annualTotal',
];

export interface PromoConfig {
  type: 'percent' | 'dollar';
  value: number;
  durationMonths: number;
}

interface BaseBlock {
  instanceId: string;
  kind: BlockKind;
}

export interface PlanBlock extends BaseBlock {
  kind: 'plan';
  definitionId: string;
  selectedSeats: number;
  visibleFeatureIds: string[];
  keyFeatureIds: string[];
  visiblePricingKeys: PricingKey[];
  promotions: Partial<Record<PricingKey, PromoConfig>>;
  promoValidUntil?: string;
}

export interface AddonBlock extends BaseBlock {
  kind: 'addon';
  definitionId: string;
  visibleFeatureIds: string[];
  keyFeatureIds: string[];
  promo: PromoConfig | null;
  promoValidUntil?: string;
}

export interface SignatureBlock extends BaseBlock {
  kind: 'signature';
}

export interface TextBlock extends BaseBlock {
  kind: 'text';
  content: string;
  displayLabel?: string;
}

export interface CheckoutLinkBlock extends BaseBlock {
  kind: 'checkout';
  url: string;
}

export type CompareSlot =
  | {
      kind: 'plan';
      definitionId: string;
      selectedSeats: number;
      visibleFeatureIds: string[];
      keyFeatureIds: string[];
      visiblePricingKeys: PricingKey[];
      promotions: Partial<Record<PricingKey, PromoConfig>>;
      promoValidUntil?: string;
    }
  | {
      kind: 'addon';
      definitionId: string;
      visibleFeatureIds: string[];
      keyFeatureIds: string[];
      promo: PromoConfig | null;
      promoValidUntil?: string;
    };

export interface CompareBlock extends BaseBlock {
  kind: 'compare';
  slots: (CompareSlot | null)[]; // always length 3
}

export type CanvasBlock = PlanBlock | AddonBlock | SignatureBlock | TextBlock | CheckoutLinkBlock | CompareBlock;

export interface EmailHeader {
  to: string;
  subject: string;
}

export interface AppState {
  header: EmailHeader;
  blocks: CanvasBlock[];
}
