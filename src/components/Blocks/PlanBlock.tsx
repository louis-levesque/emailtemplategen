import { useState, type Dispatch } from 'react';
import type { PlanBlock as PlanBlockType } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { PromoModal, type PromoRow } from './PromoModal';
import { FeatureBuckets } from './FeatureBuckets';
import {
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
  const visiblePricingOptionIds: string[] = block.visiblePricingOptionIds ?? def.pricingOptions.map(o => o.id);
  const promotions = block.promotions ?? {};
  const hasAnyPromo = Object.keys(promotions).length > 0;

  const promoRows: PromoRow[] = def.pricingOptions.map(opt => ({
    key: opt.id,
    label: opt.label,
    originalPrice: selectedTier.prices[opt.id]?.price ?? '$0/mo',
  }));

  return (
    <>
      <div className="p-3">
        <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#9DC63F' }}>

          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: def.color }}
              />
              <span className="font-semibold text-gray-800 leading-snug">{def.title}</span>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_RECOMMENDED', instanceId: block.instanceId })}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${
                  block.isRecommended
                    ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                Recommended
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowPromoModal(true)}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                  hasAnyPromo
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5h8M5 1v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {hasAnyPromo ? 'Promo' : 'Promo'}
              </button>
            </div>
          </div>

          {/* Seat selector */}
          {def.tiers.length > 1 && (
            <div className="px-4 py-2 border-t border-gray-100">
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

          {/* Tagline */}
          <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-600">{stripLinkSyntax(def.tagline)}</div>

          {/* Pricing rows */}
          <div className="px-4 py-3">
            <div className="space-y-2">
              {def.pricingOptions.map(opt => {
                const isVisible = visiblePricingOptionIds.includes(opt.id);
                const isFeatured = block.featuredPricingOptionId === opt.id;
                const promo = promotions[opt.id];
                const priceEntry = selectedTier.prices[opt.id];
                const original = priceEntry?.price ?? '$0/mo';
                const monthlyEquivalent = priceEntry?.monthlyEquivalent;
                const discounted = promo ? applyPromo(original, promo) : null;
                const unit = original.includes('/yr') ? '/yr' : '/mo';

                const rowContent = (
                  <div className="flex items-start gap-2 w-full">
                    {/* Pill toggle */}
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_PLAN_PRICING_OPTION', instanceId: block.instanceId, optionId: opt.id })}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0 mt-0.5"
                      style={
                        isVisible
                          ? { backgroundColor: def.color, borderColor: def.color, color: '#fff' }
                          : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#9ca3af' }
                      }
                    >
                      {opt.label}
                    </button>

                    {/* Price(s) */}
                    <div className="ml-auto text-right flex-shrink-0">
                      {discounted !== null ? (
                        <>
                          <div className="flex items-center gap-1.5 justify-end flex-wrap">
                            <span className="text-xs text-gray-400 line-through">{original}</span>
                            <span className="text-sm font-bold text-amber-600">{formatCurrency(discounted)}{unit}</span>
                          </div>
                          {monthlyEquivalent && (
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
                          {monthlyEquivalent && (
                            <div className={`text-xs ${isVisible ? 'text-gray-400' : 'text-gray-200'}`}>
                              ({monthlyEquivalent})
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Featured (star) toggle */}
                    <button
                      onClick={() => dispatch({
                        type: 'SET_PLAN_FEATURED_OPTION',
                        instanceId: block.instanceId,
                        optionId: isFeatured ? null : opt.id,
                      })}
                      title={isFeatured ? 'Remove featured' : 'Feature this pricing option'}
                      className="flex-shrink-0 mt-0.5 transition-colors"
                      style={{ color: isFeatured ? '#1D2D44' : '#d1d5db' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill={isFeatured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2">
                        <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13.2 7,10.8 3,13.2 4,8.6 0.6,5.6 5.2,5.2" />
                      </svg>
                    </button>
                  </div>
                );

                if (isFeatured) {
                  return (
                    <div key={opt.id} className="relative border rounded-lg px-3 py-2 mt-4" style={{ borderColor: '#1D2D44' }}>
                      <span
                        className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: '#1D2D44' }}
                      >
                        Recommended
                      </span>
                      {rowContent}
                    </div>
                  );
                }

                return <div key={opt.id}>{rowContent}</div>;
              })}
            </div>

            {hasAnyPromo && block.promoValidUntil && (
              <p className="text-xs text-amber-700 mt-2">
                Promotional pricing valid until {formatValidUntil(block.promoValidUntil)}.
              </p>
            )}
          </div>

          {/* Feature buckets */}
          <div className="px-4 py-3 border-t border-gray-100">
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
