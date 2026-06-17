import { useState, type Dispatch } from 'react';
import type { AddonBlock as AddonBlockType } from '../../types';
import { ADDONS } from '../../data/addons';
import type { CanvasAction } from '../../store/canvasReducer';
import { PromoModal } from './PromoModal';
import { applyPromo, formatCurrency, buildAddonPromoSentence } from '../../utils/priceUtils';

interface Props {
  block: AddonBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function AddonBlock({ block, dispatch }: Props) {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const def = ADDONS.find(a => a.id === block.definitionId);
  if (!def) return null;

  const promo = block.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;

  return (
    <>
      <div className="p-3">
        <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#1F9839' }}>
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-800">{def.name}</span>
            <div className="flex items-center gap-2">
              {/* Discounted price */}
              {discounted !== null ? (
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 line-through">{def.price}</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(discounted)}/mo</span>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {promo!.durationMonths} mo, then {def.price}
                  </div>
                </div>
              ) : (
                <span className="text-sm font-bold text-green-700">{def.price}</span>
              )}
              {/* Promo button */}
              <button
                onClick={() => setShowPromoModal(true)}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                  promo
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5h8M5 1v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {promo ? 'Promo' : 'Promo'}
              </button>
            </div>
          </div>

          {/* Promo sentence */}
          {promo && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700 leading-relaxed">
                {buildAddonPromoSentence(def.name, def.price, promo)}
              </p>
            </div>
          )}

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

      {showPromoModal && (
        <PromoModal
          title={def.name}
          rows={[{ key: 'price', label: def.name, originalPrice: def.price }]}
          initialPromos={promo ? { price: promo } : {}}
          onSave={promos => {
            const p = promos['price'] ?? null;
            dispatch({ type: 'SET_ADDON_PROMO', instanceId: block.instanceId, promo: p as typeof block.promo });
          }}
          onClose={() => setShowPromoModal(false)}
        />
      )}
    </>
  );
}
