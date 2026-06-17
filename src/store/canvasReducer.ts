import type { AppState, CanvasBlock, EmailHeader } from '../types';

export type CanvasAction =
  | { type: 'ADD_BLOCK'; block: CanvasBlock }
  | { type: 'REMOVE_BLOCK'; instanceId: string }
  | { type: 'REORDER_BLOCKS'; orderedIds: string[] }
  | { type: 'TOGGLE_FEATURE'; instanceId: string; featureId: string }
  | { type: 'SET_PLAN_SEATS'; instanceId: string; seats: number }
  | { type: 'UPDATE_TEXT'; instanceId: string; content: string }
  | { type: 'SET_CHECKOUT_URL'; instanceId: string; url: string }
  | { type: 'SET_HEADER'; field: keyof EmailHeader; value: string };

const GREETING_CONTENT = '{{#if Recipient.FirstName}}Hey {{Recipient.FirstName}},{{else}}Hey there!{{/if}}';

export const initialState: AppState = {
  header: { to: '', subject: '' },
  blocks: [
    { instanceId: 'greeting-initial', kind: 'text', content: GREETING_CONTENT, displayLabel: 'Greeting Text' },
  ],
};

export function canvasReducer(state: AppState, action: CanvasAction): AppState {
  switch (action.type) {
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };

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
