import { useState, type Dispatch } from 'react';
import type { AddonBlock as AddonBlockType } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { PromoModal } from './PromoModal';
import { FeatureBuckets } from './FeatureBuckets';
import { applyPromo, formatCurrency, formatValidUntil } from '../../utils/priceUtils';
import { stripLinkSyntax } from '../../utils/generateEmailHtml';

interface Props {
  block: AddonBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function AddonBlock({ block, dispatch }: Props) {
  const { addons } = useAdminData();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const def = addons.find(a => a.id === block.definitionId);
  if (!def) return null;

  const promo = block.promo ?? null;
  const discounted = promo ? applyPromo(def.price, promo) : null;

  return (
    <>
      <div className="p-3">
        <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#9DC63F' }}>
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-semibold text-gray-800">{def.name}</span>
              {block.isRecommended && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-lime-100 text-lime-700 flex-shrink-0">
                  Recommended
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Discounted price */}
              {discounted !== null ? (
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 line-through">{def.price}</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(discounted)}/mo</span>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {promo!.type === 'percent' ? `${promo!.value}%` : `$${promo!.value}`} off for {promo!.durationMonths} mo, then {def.price}
                  </div>
                </div>
              ) : (
                <span className="text-sm font-bold text-jobber-dark">{def.price}</span>
              )}
              {/* Recommended toggle */}
              <button
                onClick={() => dispatch({ type: 'TOGGLE_RECOMMENDED', instanceId: block.instanceId })}
                className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                  block.isRecommended
                    ? 'bg-lime-50 border-lime-300 text-lime-700 hover:bg-lime-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                ★
              </button>
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

          {promo && block.promoValidUntil && (
            <div className="px-4 pt-1.5">
              <p className="text-xs text-amber-700">
                Promotional pricing valid until {formatValidUntil(block.promoValidUntil)}.
              </p>
            </div>
          )}
          <div className="px-4 pt-2 pb-1 text-sm text-gray-600">{stripLinkSyntax(def.description)}</div>
          <div className="px-4 py-3">
            <FeatureBuckets
              allFeatures={def.features}
              visibleFeatureIds={block.visibleFeatureIds}
              keyFeatureIds={block.keyFeatureIds ?? []}
              onSetBucket={(featureId, bucket) =>
                dispatch({ type: 'SET_FEATURE_BUCKET', instanceId: block.instanceId, featureId, bucket })
              }
            />
          </div>
        </div>
      </div>

      {showPromoModal && (
        <PromoModal
          title={def.name}
          rows={[{ key: 'price', label: def.name, originalPrice: def.price }]}
          initialPromos={promo ? { price: promo } : {}}
          initialValidUntil={block.promoValidUntil}
          onSave={(promos, validUntil) => {
            const p = promos['price'] ?? null;
            dispatch({ type: 'SET_ADDON_PROMO', instanceId: block.instanceId, promo: p as typeof block.promo, validUntil });
          }}
          onClose={() => setShowPromoModal(false)}
        />
      )}
    </>
  );
}
