import type { Dispatch } from 'react';
import type { PlanBlock as PlanBlockType } from '../../types';
import { PLANS } from '../../data/plans';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: PlanBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function PlanBlock({ block, dispatch }: Props) {
  const def = PLANS.find(p => p.id === block.definitionId);
  if (!def) return null;

  return (
    <div className="p-3">
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: def.color }}>
        <div className="px-4 py-3 text-white" style={{ backgroundColor: def.color }}>
          <div className="font-bold text-lg">{def.title}</div>
          <div className="text-sm opacity-80">{def.tagline}</div>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-b" style={{ borderColor: def.color + '33' }}>
          <span className="text-xl font-bold" style={{ color: def.color }}>{def.monthlyPrice}</span>
          <span className="text-xs text-gray-500 ml-2">{def.annualPrice}</span>
        </div>
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
