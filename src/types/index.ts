export interface PlanFeature {
  id: string;
  label: string;
}

export interface PlanPricingOption {
  id: string;
  label: string;
}

export interface PriceTier {
  seats: number;
  prices: Record<string, { price: string; monthlyEquivalent?: string }>;
}

export interface PlanDefinition {
  id: string;
  title: string;
  tagline: string;
  pricingOptions: PlanPricingOption[];
  tiers: PriceTier[];
  color: string;
  features: PlanFeature[];
}

export interface AddonPriceTier {
  id: string;                  // stable generated ID
  label: string;               // "Monthly, no commitment"
  price: string;               // "$29/mo"
  monthlyEquivalent?: string;  // for annual tiers: "($24.17/mo)" — optional
}

export interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  tiers: AddonPriceTier[];
  features: PlanFeature[];
}

export type BlockKind = 'plan' | 'addon' | 'signature' | 'text' | 'heading' | 'checkout' | 'compare';

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
  visiblePricingOptionIds: string[];
  promotions: Partial<Record<string, PromoConfig>>;
  promoValidUntil?: string;
  isRecommended?: boolean;
  featuredPricingOptionId?: string;
}

export interface AddonBlock extends BaseBlock {
  kind: 'addon';
  definitionId: string;
  visibleFeatureIds: string[];
  keyFeatureIds: string[];
  visibleTierIds: string[];
  promotions: Partial<Record<string, PromoConfig>>;
  promoValidUntil?: string;
  isRecommended?: boolean;
  featuredTierId?: string;
}

export interface SignatureBlock extends BaseBlock {
  kind: 'signature';
}

export interface TextBlock extends BaseBlock {
  kind: 'text';
  content: string;
  displayLabel?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface HeadingBlock extends BaseBlock {
  kind: 'heading';
  text: string;
  alignment?: 'left' | 'center' | 'right';
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
      visiblePricingOptionIds: string[];
      promotions: Partial<Record<string, PromoConfig>>;
      promoValidUntil?: string;
      isRecommended?: boolean;
      featuredPricingOptionId?: string;
    }
  | {
      kind: 'addon';
      definitionId: string;
      visibleFeatureIds: string[];
      keyFeatureIds: string[];
      visibleTierIds: string[];
      promotions: Partial<Record<string, PromoConfig>>;
      promoValidUntil?: string;
      isRecommended?: boolean;
      featuredTierId?: string;
    };

export interface CompareBlock extends BaseBlock {
  kind: 'compare';
  slots: (CompareSlot | null)[]; // always length 3
}

export type CanvasBlock = PlanBlock | AddonBlock | SignatureBlock | TextBlock | HeadingBlock | CheckoutLinkBlock | CompareBlock;

export interface EmailHeader {
  to: string;
  subject: string;
}

export interface AppState {
  header: EmailHeader;
  blocks: CanvasBlock[];
}
