import type { Dispatch } from 'react';
import type { AddonBlock as AddonBlockType } from '../../types';
import { ADDONS } from '../../data/addons';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: AddonBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function AddonBlock({ block, dispatch }: Props) {
  const def = ADDONS.find(a => a.id === block.definitionId);
  if (!def) return null;

  return (
    <div className="p-3">
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#1F9839' }}>
        <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
          <span className="font-semibold text-gray-800">{def.name}</span>
          <span className="text-sm font-bold text-green-700">{def.price}</span>
        </div>
        <div className="px-4 pt-2 pb-1 text-sm text-gray-600">{def.description}</div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features to include</p>
          <div className="space-y-1">
            {def.features.map(f => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-green-600"
                  checked={block.visibleFeatureIds.includes(f.id)}
                  onChange={() => dispatch({ type: 'TOGGLE_FEATURE', instanceId: block.instanceId, featureId: f.id })}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
