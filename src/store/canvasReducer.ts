import type { AppState, CanvasBlock, EmailHeader } from '../types';

export type CanvasAction =
  | { type: 'ADD_BLOCK'; block: CanvasBlock }
  | { type: 'REMOVE_BLOCK'; instanceId: string }
  | { type: 'REORDER_BLOCKS'; orderedIds: string[] }
  | { type: 'TOGGLE_FEATURE'; instanceId: string; featureId: string }
  | { type: 'UPDATE_TEXT'; instanceId: string; content: string }
  | { type: 'SET_HEADER'; field: keyof EmailHeader; value: string };

export const initialState: AppState = {
  header: { to: '', subject: '' },
  blocks: [],
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

    case 'UPDATE_TEXT':
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.instanceId === action.instanceId && b.kind === 'text'
            ? { ...b, content: action.content }
            : b
        ),
      };

    case 'SET_HEADER':
      return { ...state, header: { ...state.header, [action.field]: action.value } };

    default:
      return state;
  }
}
