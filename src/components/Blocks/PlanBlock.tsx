import { useState, type Dispatch } from 'react';
import type { PlanBlock as PlanBlockType, PricingKey } from '../../types';
import { ALL_PRICING_KEYS } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { PromoModal, type PromoRow } from './PromoModal';
import { FeatureBuckets } from './FeatureBuckets';
import {
  PRICING_LABELS,
  applyPromo,
  formatCurrency,
  formatValidUntil,
} from '../../utils/priceUtils';
import { stripLinkSyntax } from '../../utils/generateEmailHtml';

interface Props {
  block: PlanBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function PlanBlock({ block, dispatch }: Props) {
  const { plans } = useAdminData();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const def = plans.find(p => p.id === block.definitionId);
  if (!def) return null;

  const selectedTier = def.tiers.find(t => t.seats === block.selectedSeats) ?? def.tiers[0];
  const visiblePricingKeys: PricingKey[] = block.visiblePricingKeys ?? ALL_PRICING_KEYS;
  const promotions = block.promotions ?? {};
  const hasAnyPromo = Object.keys(promotions).length > 0;

  const promoRows: PromoRow[] = ALL_PRICING_KEYS.map(key => ({
    key,
    label: PRICING_LABELS[key],
    originalPrice: selectedTier[key],
  }));

  return (
    <>
      <div className="p-3">
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: def.color }}>
          {/* Header */}
          <div className="px-4 py-3 text-white" style={{ backgroundColor: def.color }}>
            <div className="font-bold text-lg">{def.title}</div>
            <div className="text-sm opacity-80">{stripLinkSyntax(def.tagline)}</div>
          </div>

          {/* Seat selector */}
          {def.tiers.length > 1 && (
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">User seats</p>
              <div className="flex gap-1.5 flex-wrap">
                {def.tiers.map(tier => (
                  <button
                    key={tier.seats}
                    onClick={() => dispatch({ type: 'SET_PLAN_SEATS', instanceId: block.instanceId, seats: tier.seats })}
                    className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                    style={
                      selectedTier.seats === tier.seats
                        ? { backgroundColor: def.color, borderColor: def.color, color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: def.color + '66', color: def.color }
                    }
                  >
                    {tier.seats} {tier.seats === 1 ? 'user' : 'users'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing rows */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pricing</p>
              <button
                onClick={() => setShowPromoModal(true)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  hasAnyPromo
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 5.5h9M5.5 1v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {hasAnyPromo ? 'Edit Promotion' : 'Add Promotion'}
              </button>
            </div>

            <div className="space-y-1.5">
              {ALL_PRICING_KEYS.map(key => {
                const isVisible = visiblePricingKeys.includes(key);
                const promo = promotions[key];
                const original = selectedTier[key];
                const discounted = promo ? applyPromo(original, promo) : null;
                const unit = original.includes('/yr') ? '/yr' : '/mo';
                const isAnnualTotal = key === 'annualTotal';

                return (
                  <div key={key} className="flex items-start justify-between gap-2">
                    {/* Visibility toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-jobber"
                        checked={isVisible}
                        onChange={() => dispatch({ type: 'TOGGLE_PRICING_KEY', instanceId: block.instanceId, key })}
                      />
                      <span className={`text-xs ${isVisible ? 'text-gray-500' : 'text-gray-300'}`}>
                        {PRICING_LABELS[key]}
                      </span>
                    </label>

                    {/* Price(s) */}
                    <div className="text-right flex-shrink-0">
                      {discounted !== null ? (
                        <>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs text-gray-400 line-through">{original}</span>
                            <span className="text-sm font-bold text-amber-600">
                              {formatCurrency(discounted)}{unit}
                            </span>
                          </div>
                          {isAnnualTotal && (
                            <div className="text-xs text-amber-500">
                              ({formatCurrency(Math.round((discounted / 12) * 100) / 100)}/mo)
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {promo!.type === 'percent' ? `${promo!.value}%` : `$${promo!.value}`} off for {promo!.durationMonths} mo, then {original}
                          </div>
                        </>
                      ) : (
                        <>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: isVisible ? def.color : '#d1d5db' }}
                          >
                            {original}
                          </span>
                          {isAnnualTotal && (
                            <div className={`text-xs ${isVisible ? 'text-gray-400' : 'text-gray-200'}`}>
                              ({selectedTier.annualMonthly})
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasAnyPromo && block.promoValidUntil && (
              <p className="text-xs text-amber-700 mt-2">
                Promotional pricing valid until {formatValidUntil(block.promoValidUntil)}.
              </p>
            )}
          </div>

          {/* Feature buckets */}
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
          title={`${def.title} — ${selectedTier.seats} ${selectedTier.seats === 1 ? 'user' : 'users'}`}
          rows={promoRows}
          initialPromos={promotions}
          initialValidUntil={block.promoValidUntil}
          onSave={(promos, validUntil) => dispatch({ type: 'SET_PLAN_PROMOTIONS', instanceId: block.instanceId, promotions: promos, validUntil })}
          onClose={() => setShowPromoModal(false)}
        />
      )}
    </>
  );
}
