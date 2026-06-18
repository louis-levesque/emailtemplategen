import type { AppState, CanvasBlock, EmailHeader, PricingKey, PromoConfig } from '../types';

export type CanvasAction =
  | { type: 'ADD_BLOCK'; block: CanvasBlock }
  | { type: 'ADD_BLOCK_AT'; block: CanvasBlock; index: number }
  | { type: 'REMOVE_BLOCK'; instanceId: string }
  | { type: 'REORDER_BLOCKS'; orderedIds: string[] }
  | { type: 'TOGGLE_FEATURE'; instanceId: string; featureId: string }
  | { type: 'SET_FEATURE_BUCKET'; instanceId: string; featureId: string; bucket: 'key' | 'included' | 'hidden' }
  | { type: 'SET_PLAN_SEATS'; instanceId: string; seats: number }
  | { type: 'TOGGLE_PRICING_KEY'; instanceId: string; key: PricingKey }
  | { type: 'SET_PLAN_PROMOTIONS'; instanceId: string; promotions: Partial<Record<PricingKey, PromoConfig>>; validUntil: string | null }
  | { type: 'SET_ADDON_PROMO'; instanceId: string; promo: PromoConfig | null; validUntil: string | null }
  | { type: 'UPDATE_TEXT'; instanceId: string; content: string }
  | { type: 'SET_CHECKOUT_URL'; instanceId: string; url: string }
  | { type: 'SET_HEADER'; field: keyof EmailHeader; value: string };

export const initialState: AppState = {
  header: { to: '', subject: '' },
  blocks: [
    { instanceId: 'greeting-initial', kind: 'text', content: '', displayLabel: 'Greeting Text' },
  ],
};

export function canvasReducer(state: AppState, action: CanvasAction): AppState {
  switch (action.type) {
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };

    case 'ADD_BLOCK_AT': {
      const blocks = [...state.blocks];
      blocks.splice(action.index, 0, action.block);
      return { ...state, blocks };
    }

    case 'REMOVE_BLOCK':
      return { ...state, blocks: state.blocks.filter(b => b.instanceId !== action.instanceId) };

    case 'REORDER_BLOCKS': {
      const map = new Map(state.blocks.map(b => [b.instanceId, b]));
      const reordered = action.orderedIds.map(id => map.get(id)).filter(Boolean) as CanvasBlock[];
      return { ...state, blocks: reordered };
    }

    case 'TOGGLE_FEATURE': {
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.instanceId !== action.instanceId) return b;
          if (b.kind !== 'plan' && b.kind !== 'addon') return b;
          const has = b.visibleFeatureIds.includes(action.featureId);
          return {
            ...b,
            visibleFeatureIds: has
              ? b.visibleFeatureIds.filter(id => id !== action.featureId)
              : [...b.visibleFeatureIds, action.featureId],
          };
        }),
      };
    }

    case 'SET_FEATURE_BUCKET': {
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.instanceId !== action.instanceId) return b;
          if (b.kind !== 'plan' && b.kind !== 'addon') return b;
          const { featureId, bucket } = action;
          const keyIds = b.keyFeatureIds ?? [];
          if (bucket === 'key') {
            return {
              ...b,
              visibleFeatureIds: b.visibleFeatureIds.includes(featureId)
                ? b.visibleFeatureIds
                : [...b.visibleFeatureIds, featureId],
              keyFeatureIds: keyIds.includes(featureId) ? keyIds : [...keyIds, featureId],
            };
          }
          if (bucket === 'included') {
            return {
              ...b,
              visibleFeatureIds: b.visibleFeatureIds.includes(featureId)
                ? b.visibleFeatureIds
                : [...b.visibleFeatureIds, featureId],
              keyFeatureIds: keyIds.filter(id => id !== featureId),
            };
          }
          // hidden
          return {
            ...b,
            visibleFeatureIds: b.visibleFeatureIds.filter(id => id !== featureId),
            keyFeatureIds: keyIds.filter(id => id !== featureId),
          };
        }),
      };
    }

    case 'SET_PLAN_SEATS': {
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'plan'
            ? { ...b, selectedSeats: action.seats }
            : b
        ),
      };
    }

    case 'UPDATE_TEXT':
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'text'
            ? { ...b, content: action.content }
            : b
        ),
      };

    case 'TOGGLE_PRICING_KEY': {
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.instanceId !== action.instanceId || b.kind !== 'plan') return b;
          const keys = b.visiblePricingKeys ?? [];
          const has = keys.includes(action.key);
          return {
            ...b,
            visiblePricingKeys: has ? keys.filter(k => k !== action.key) : [...keys, action.key],
          };
        }),
      };
    }

    case 'SET_PLAN_PROMOTIONS': {
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'plan'
            ? { ...b, promotions: action.promotions, promoValidUntil: action.validUntil ?? undefined }
            : b
        ),
      };
    }

    case 'SET_ADDON_PROMO': {
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'addon'
            ? { ...b, promo: action.promo, promoValidUntil: action.validUntil ?? undefined }
            : b
        ),
      };
    }

    case 'SET_CHECKOUT_URL':
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'checkout'
            ? { ...b, url: action.url }
            : b
        ),
      };

    case 'SET_HEADER':
      return { ...state, header: { ...state.header, [action.field]: action.value } };

    default:
      return state;
  }
}
