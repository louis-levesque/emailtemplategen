import { useState, useEffect, useRef, type Dispatch } from 'react';
import type { CompareBlock as CompareBlockType, CompareSlot, PromoConfig } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { stripLinkSyntax } from '../../utils/generateEmailHtml';
import { FeatureBuckets } from './FeatureBuckets';
import { PromoModal, type PromoRow } from './PromoModal';
import { applyPromo, formatCurrency, formatValidUntil } from '../../utils/priceUtils';

interface Props {
  block: CompareBlockType;
  dispatch: Dispatch<CanvasAction>;
}

// ---------------------------------------------------------------------------
// SlotPicker dropdown
// ---------------------------------------------------------------------------

interface SlotPickerProps {
  onSelect: (slot: CompareSlot) => void;
  onClose: () => void;
}

function SlotPicker({ onSelect, onClose }: SlotPickerProps) {
  const { plans, addons } = useAdminData();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  function handleSelectPlan(planId: string) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    onSelect({
      kind: 'plan',
      definitionId: plan.id,
      selectedSeats: plan.tiers[0].seats,
      visibleFeatureIds: plan.features.map(f => f.id),
      keyFeatureIds: [],
      visiblePricingOptionIds: plan.pricingOptions.map(o => o.id),
      promotions: {},
    });
  }

  function handleSelectAddon(addonId: string) {
    const addon = addons.find(a => a.id === addonId);
    if (!addon) return;
    onSelect({
      kind: 'addon',
      definitionId: addon.id,
      visibleTierIds: addon.tiers.map(t => t.id),
      promotions: {},
      visibleFeatureIds: addon.features.map(f => f.id),
      keyFeatureIds: [],
    });
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose item</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm font-bold leading-none"
        >
          ×
        </button>
      </div>

      {plans.length > 0 && (
        <>
          <div className="px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plans</span>
          </div>
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: plan.color }}
              />
              <span className="text-sm text-gray-800 truncate">{plan.title}</span>
            </button>
          ))}
        </>
      )}

      {addons.length > 0 && (
        <>
          <div className="px-3 py-1.5 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add-ons</span>
          </div>
          {addons.map(addon => (
            <button
              key={addon.id}
              onClick={() => handleSelectAddon(addon.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-400" />
              <span className="text-sm text-gray-800 truncate">{addon.name}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanSlotCard
// ---------------------------------------------------------------------------

interface PlanSlotCardProps {
  slot: Extract<CompareSlot, { kind: 'plan' }>;
  slotIndex: number;
  instanceId: string;
  dispatch: Dispatch<CanvasAction>;
  onClear: () => void;
  onModalOpenChange: (open: boolean) => void;
}

function PlanSlotCard({ slot, slotIndex, instanceId, dispatch, onClear, onModalOpenChange }: PlanSlotCardProps) {
  const { plans } = useAdminData();
  const [showPromoModal, setShowPromoModal] = useState(false);

  function openPromoModal() { setShowPromoModal(true); onModalOpenChange(true); }
  function closePromoModal() { setShowPromoModal(false); onModalOpenChange(false); }

  const def = plans.find(p => p.id === slot.definitionId);
  if (!def) return null;

  const selectedTier = def.tiers.find(t => t.seats === slot.selectedSeats) ?? def.tiers[0];
  const visiblePricingOptionIds: string[] = slot.visiblePricingOptionIds ?? def.pricingOptions.map(o => o.id);
  const promotions = slot.promotions ?? {};
  const hasAnyPromo = Object.keys(promotions).length > 0;

  const promoRows: PromoRow[] = def.pricingOptions.map(opt => ({
    key: opt.id,
    label: opt.label,
    originalPrice: selectedTier.prices[opt.id]?.price ?? '$0/mo',
  }));

  function updateSlot(updates: Partial<typeof slot>) {
    dispatch({
      type: 'SET_COMPARE_SLOT',
      instanceId,
      slotIndex,
      slot: { ...slot, ...updates },
    });
  }

  function handleSetBucket(featureId: string, bucket: 'key' | 'included' | 'hidden') {
    let newVisible = [...slot.visibleFeatureIds];
    let newKey = [...slot.keyFeatureIds];
    if (bucket === 'key') {
      if (!newVisible.includes(featureId)) newVisible = [...newVisible, featureId];
      if (!newKey.includes(featureId)) newKey = [...newKey, featureId];
    } else if (bucket === 'included') {
      if (!newVisible.includes(featureId)) newVisible = [...newVisible, featureId];
      newKey = newKey.filter(id => id !== featureId);
    } else {
      newVisible = newVisible.filter(id => id !== featureId);
      newKey = newKey.filter(id => id !== featureId);
    }
    updateSlot({ visibleFeatureIds: newVisible, keyFeatureIds: newKey });
  }

  return (
    <>
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#9DC63F' }}>
        {/* Header */}
        <div className="pb-2 bg-gray-50">
          {/* Recommended badge — always visible above the name, click to toggle */}
          <button
            onClick={() => updateSlot({ isRecommended: !slot.isRecommended })}
            className={`w-full text-center text-[10px] font-semibold py-1.5 transition-colors ${
              slot.isRecommended
                ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            Recommended
          </button>

          <div className="px-3 pt-2.5">
            {/* Row 1: drag handle + name + × */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-shrink-0 opacity-0 group-hover/slot:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Drag to reorder">
                <DragHandleIcon />
              </div>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: def.color }} />
              <span className="font-semibold text-gray-800 leading-snug truncate flex-1 min-w-0">{def.title}</span>
              <button
                onClick={onClear}
                className="w-5 h-5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ml-auto"
                title="Remove"
              >
                ×
              </button>
            </div>
            {/* Row 2: promo button */}
            <div className="mt-2 pl-5">
              <button
                onClick={openPromoModal}
                className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                  hasAnyPromo
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {hasAnyPromo ? 'Edit Promo' : '+ Promo'}
              </button>
            </div>
          </div>
        </div>

        {/* Seat selector — always shown so single-tier plans (e.g. Core) display their seat count */}
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">User seats</p>
          <div className="flex gap-1.5 flex-wrap">
            {def.tiers.map(tier => (
              <button
                key={tier.seats}
                onClick={() => updateSlot({ selectedSeats: tier.seats })}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors"
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

        {/* Tagline */}
        <div className="px-4 pt-2 pb-1 text-xs text-gray-600">{stripLinkSyntax(def.tagline)}</div>

        {/* Pricing rows */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="space-y-2">
            {(() => {
              const hasFeaturedVisible = !!slot.featuredPricingOptionId && visiblePricingOptionIds.includes(slot.featuredPricingOptionId);
              return def.pricingOptions.map(opt => {
                const isVisible = visiblePricingOptionIds.includes(opt.id);
                const isFeatured = slot.featuredPricingOptionId === opt.id;
                const promo = promotions[opt.id];
                const priceEntry = selectedTier.prices[opt.id];
                const original = priceEntry?.price ?? '$0/mo';
                const monthlyEquivalent = priceEntry?.monthlyEquivalent;
                const discounted = promo ? applyPromo(original, promo) : null;
                const unit = original.includes('/yr') ? '/yr' : '/mo';

                const priceDisplay = (
                  <div className="text-[10px] pl-1">
                    {discounted !== null ? (
                      <>
                        <span className="text-gray-400 line-through">{original}</span>
                        {' '}
                        <span className="font-bold text-amber-600">{formatCurrency(discounted)}{unit}</span>
                        {monthlyEquivalent && <div className="text-amber-500">({formatCurrency(Math.round((discounted / 12) * 100) / 100)}/mo)</div>}
                        <div className="text-gray-400">{promo!.type === 'percent' ? `${promo!.value}%` : `$${promo!.value}`} off for {promo!.durationMonths} mo</div>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold" style={{ color: isVisible ? def.color : '#d1d5db' }}>
                          {original}
                        </span>
                        {monthlyEquivalent && isVisible && (
                          <div className="text-gray-400">({monthlyEquivalent})</div>
                        )}
                      </>
                    )}
                  </div>
                );

                const row = (
                  <div className="space-y-0.5">
                    {/* Full-width toggle button */}
                    <button
                      onClick={() => {
                        const newIds = isVisible
                          ? visiblePricingOptionIds.filter(id => id !== opt.id)
                          : [...visiblePricingOptionIds, opt.id];
                        updateSlot({ visiblePricingOptionIds: newIds });
                      }}
                      className="w-full text-left px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors leading-snug"
                      style={
                        isVisible
                          ? { backgroundColor: def.color, borderColor: def.color, color: '#fff' }
                          : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#9ca3af' }
                      }
                    >
                      {opt.label}
                    </button>
                    {priceDisplay}
                    {/* Recommended toggle */}
                    {isVisible && (
                      <button
                        onClick={() => updateSlot({ featuredPricingOptionId: isFeatured ? undefined : opt.id })}
                        className={`w-full text-center text-[8px] font-semibold py-0.5 rounded transition-colors ${
                          isFeatured
                            ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        Recommended
                      </button>
                    )}
                  </div>
                );

                if (isFeatured) {
                  return (
                    <div key={opt.id} className="rounded overflow-hidden" style={{ border: '1px solid #1D2D44' }}>
                      <div className="text-center text-[8px] font-bold tracking-widest py-0.5" style={{ backgroundColor: '#1D2D44', color: '#fff' }}>
                        RECOMMENDED
                      </div>
                      <div className="px-2 py-1.5 border-t" style={{ borderColor: '#e5e7eb' }}>
                        {row}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={opt.id} className={hasFeaturedVisible ? 'px-2' : ''}>
                    {row}
                  </div>
                );
              });
            })()}
          </div>
          {hasAnyPromo && slot.promoValidUntil && (
            <p className="text-[10px] text-amber-700 mt-2">
              Promo valid until {formatValidUntil(slot.promoValidUntil)}.
            </p>
          )}
        </div>

        {/* Feature buckets */}
        <div className="px-4 py-3 border-t border-gray-100">
          <FeatureBuckets
            allFeatures={def.features}
            visibleFeatureIds={slot.visibleFeatureIds}
            keyFeatureIds={slot.keyFeatureIds}
            onSetBucket={handleSetBucket}
          />
        </div>
      </div>

      {showPromoModal && (
        <PromoModal
          title={`${def.title} — ${selectedTier.seats} ${selectedTier.seats === 1 ? 'user' : 'users'}`}
          rows={promoRows}
          initialPromos={promotions}
          initialValidUntil={slot.promoValidUntil}
          onSave={(promos, validUntil) => {
            updateSlot({
              promotions: promos as Partial<Record<string, PromoConfig>>,
              promoValidUntil: validUntil ?? undefined,
            });
          }}
          onClose={closePromoModal}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// AddonSlotCard
// ---------------------------------------------------------------------------

interface AddonSlotCardProps {
  slot: Extract<CompareSlot, { kind: 'addon' }>;
  slotIndex: number;
  instanceId: string;
  dispatch: Dispatch<CanvasAction>;
  onClear: () => void;
  onModalOpenChange: (open: boolean) => void;
}

function AddonSlotCard({ slot, slotIndex, instanceId, dispatch, onClear, onModalOpenChange }: AddonSlotCardProps) {
  const { addons } = useAdminData();
  const [showPromoModal, setShowPromoModal] = useState(false);

  function openPromoModal() { setShowPromoModal(true); onModalOpenChange(true); }
  function closePromoModal() { setShowPromoModal(false); onModalOpenChange(false); }

  const def = addons.find(a => a.id === slot.definitionId);
  if (!def) return null;

  const visibleTierIds: string[] = slot.visibleTierIds ?? def.tiers.map(t => t.id);
  const promotions = slot.promotions ?? {};
  const hasAnyPromo = Object.keys(promotions).length > 0;

  const promoRows: PromoRow[] = def.tiers.map(tier => ({
    key: tier.id,
    label: tier.label,
    originalPrice: tier.price,
  }));

  function updateSlot(updates: Partial<typeof slot>) {
    dispatch({
      type: 'SET_COMPARE_SLOT',
      instanceId,
      slotIndex,
      slot: { ...slot, ...updates },
    });
  }

  function handleSetBucket(featureId: string, bucket: 'key' | 'included' | 'hidden') {
    let newVisible = [...slot.visibleFeatureIds];
    let newKey = [...slot.keyFeatureIds];
    if (bucket === 'key') {
      if (!newVisible.includes(featureId)) newVisible = [...newVisible, featureId];
      if (!newKey.includes(featureId)) newKey = [...newKey, featureId];
    } else if (bucket === 'included') {
      if (!newVisible.includes(featureId)) newVisible = [...newVisible, featureId];
      newKey = newKey.filter(id => id !== featureId);
    } else {
      newVisible = newVisible.filter(id => id !== featureId);
      newKey = newKey.filter(id => id !== featureId);
    }
    updateSlot({ visibleFeatureIds: newVisible, keyFeatureIds: newKey });
  }

  return (
    <>
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: '#9DC63F' }}>
        {/* Header */}
        <div className="pb-2 bg-gray-50">
          {/* Recommended badge — always visible above the name, click to toggle */}
          <button
            onClick={() => updateSlot({ isRecommended: !slot.isRecommended })}
            className={`w-full text-center text-[10px] font-semibold py-1.5 transition-colors ${
              slot.isRecommended
                ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            Recommended
          </button>

          <div className="px-3 pt-2.5">
            {/* Row 1: drag handle + name + × */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-shrink-0 opacity-0 group-hover/slot:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Drag to reorder">
                <DragHandleIcon />
              </div>
              <span className="font-semibold text-gray-800 leading-snug truncate flex-1 min-w-0">{def.name}</span>
              <button
                onClick={onClear}
                className="w-5 h-5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ml-auto"
                title="Remove"
              >
                ×
              </button>
            </div>
            {/* Row 2: promo button */}
            <div className="mt-2 pl-5">
              <button
                onClick={openPromoModal}
                className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                  hasAnyPromo
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {hasAnyPromo ? 'Edit Promo' : '+ Promo'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-2 pb-1 text-sm text-gray-600">{stripLinkSyntax(def.description)}</div>

        {/* Pricing rows */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="space-y-2">
            {(() => {
              const hasFeaturedVisible = !!slot.featuredTierId && visibleTierIds.includes(slot.featuredTierId);
              return def.tiers.map(tier => {
                const isVisible = visibleTierIds.includes(tier.id);
                const isFeatured = slot.featuredTierId === tier.id;
                const promo = promotions[tier.id];
                const discounted = promo ? applyPromo(tier.price, promo) : null;
                const unit = tier.price.includes('/yr') ? '/yr' : '/mo';

                const priceDisplay = (
                  <div className="text-[10px] pl-1">
                    {discounted !== null ? (
                      <>
                        <span className="text-gray-400 line-through">{tier.price}</span>
                        {' '}
                        <span className="font-bold text-amber-600">{formatCurrency(discounted)}{unit}</span>
                        {tier.monthlyEquivalent && (
                          <div className="text-amber-500">({formatCurrency(Math.round((discounted / 12) * 100) / 100)}/mo)</div>
                        )}
                        <div className="text-gray-400">{promo!.type === 'percent' ? `${promo!.value}%` : `$${promo!.value}`} off for {promo!.durationMonths} mo</div>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold" style={{ color: isVisible ? '#9DC63F' : '#d1d5db' }}>
                          {tier.price}
                        </span>
                        {tier.monthlyEquivalent && isVisible && (
                          <div className="text-gray-400">{tier.monthlyEquivalent}</div>
                        )}
                      </>
                    )}
                  </div>
                );

                const row = (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        const newIds = isVisible
                          ? visibleTierIds.filter(id => id !== tier.id)
                          : [...visibleTierIds, tier.id];
                        updateSlot({ visibleTierIds: newIds });
                      }}
                      className="w-full text-left px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors leading-snug"
                      style={
                        isVisible
                          ? { backgroundColor: '#9DC63F', borderColor: '#9DC63F', color: '#fff' }
                          : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#9ca3af' }
                      }
                    >
                      {tier.label}
                    </button>
                    {priceDisplay}
                    {/* Recommended toggle */}
                    {isVisible && (
                      <button
                        onClick={() => updateSlot({ featuredTierId: isFeatured ? undefined : tier.id })}
                        className={`w-full text-center text-[8px] font-semibold py-0.5 rounded transition-colors ${
                          isFeatured
                            ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        Recommended
                      </button>
                    )}
                  </div>
                );

                if (isFeatured) {
                  return (
                    <div key={tier.id} className="rounded overflow-hidden" style={{ border: '1px solid #1D2D44' }}>
                      <div className="text-center text-[8px] font-bold tracking-widest py-0.5" style={{ backgroundColor: '#1D2D44', color: '#fff' }}>
                        RECOMMENDED
                      </div>
                      <div className="px-2 py-1.5 border-t" style={{ borderColor: '#e5e7eb' }}>
                        {row}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={tier.id} className={hasFeaturedVisible ? 'px-2' : ''}>
                    {row}
                  </div>
                );
              });
            })()}
          </div>
          {hasAnyPromo && slot.promoValidUntil && (
            <p className="text-[10px] text-amber-700 mt-2">
              Promo valid until {formatValidUntil(slot.promoValidUntil)}.
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <FeatureBuckets
            allFeatures={def.features}
            visibleFeatureIds={slot.visibleFeatureIds}
            keyFeatureIds={slot.keyFeatureIds}
            onSetBucket={handleSetBucket}
          />
        </div>
      </div>

      {showPromoModal && (
        <PromoModal
          title={def.name}
          rows={promoRows}
          initialPromos={promotions}
          initialValidUntil={slot.promoValidUntil}
          onSave={(promos, validUntil) => {
            updateSlot({
              promotions: promos as Partial<Record<string, PromoConfig>>,
              promoValidUntil: validUntil ?? undefined,
            });
          }}
          onClose={closePromoModal}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Drag handle icon (shared between slot types)
// ---------------------------------------------------------------------------

function DragHandleIcon() {
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
      <circle cx="2" cy="2" r="1.3" fill="#9ca3af"/>
      <circle cx="8" cy="2" r="1.3" fill="#9ca3af"/>
      <circle cx="14" cy="2" r="1.3" fill="#9ca3af"/>
      <circle cx="2" cy="6" r="1.3" fill="#9ca3af"/>
      <circle cx="8" cy="6" r="1.3" fill="#9ca3af"/>
      <circle cx="14" cy="6" r="1.3" fill="#9ca3af"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SlotCard dispatcher
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: CompareSlot;
  slotIndex: number;
  instanceId: string;
  dispatch: Dispatch<CanvasAction>;
  onClear: () => void;
  onModalOpenChange: (open: boolean) => void;
}

function SlotCard({ slot, slotIndex, instanceId, dispatch, onClear, onModalOpenChange }: SlotCardProps) {
  if (slot.kind === 'plan') {
    return (
      <PlanSlotCard
        slot={slot}
        slotIndex={slotIndex}
        instanceId={instanceId}
        dispatch={dispatch}
        onClear={onClear}
        onModalOpenChange={onModalOpenChange}
      />
    );
  }
  return (
    <AddonSlotCard
      slot={slot}
      slotIndex={slotIndex}
      instanceId={instanceId}
      dispatch={dispatch}
      onClear={onClear}
      onModalOpenChange={onModalOpenChange}
    />
  );
}

// ---------------------------------------------------------------------------
// Main CompareBlock component
// ---------------------------------------------------------------------------

export function CompareBlock({ block, dispatch }: Props) {
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [modalOpenCount, setModalOpenCount] = useState(0);

  function handleModalOpenChange(open: boolean) {
    setModalOpenCount(c => open ? c + 1 : Math.max(0, c - 1));
  }

  function setSlot(slotIndex: number, slot: CompareSlot | null) {
    dispatch({ type: 'SET_COMPARE_SLOT', instanceId: block.instanceId, slotIndex, slot });
  }

  function handleDragStart(i: number, e: React.DragEvent) {
    // Cancel drag if it originated from an interactive element (button, input, etc.)
    // so that clicking those elements never puts the browser into drag mode.
    const origin = e.target as HTMLElement;
    if (origin.closest('button, input, textarea, select, a, [role="button"]')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    // Use the slot wrapper itself as the drag image so it looks like the card is moving.
    // We offset by the pointer position within the element for a natural grab feel.
    const target = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(target, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    // Delay the opacity change so the snapshot is taken at full opacity first.
    setTimeout(() => setDraggingIdx(i), 0);
  }

  function handleDragEnter(i: number) {
    if (draggingIdx !== null && i !== draggingIdx) setDragOverIdx(i);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(i: number) {
    if (draggingIdx !== null && draggingIdx !== i) {
      const next = [...block.slots];
      const [moved] = next.splice(draggingIdx, 1);
      next.splice(i, 0, moved);
      dispatch({ type: 'REORDER_COMPARE_SLOTS', instanceId: block.instanceId, slots: next });
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div className="p-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50">
        {/* Block header */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white rounded-t-lg flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Compare</span>
          <span className="text-xs text-gray-400">— up to 3 plans or add-ons side by side. Reads better with 2</span>
        </div>

        {/* Slots */}
        <div className="flex gap-3 p-3 items-start">
          {block.slots.map((slot, i) => (
            <div
              key={i}
              className={[
                'flex-1 relative min-w-0 group/slot transition-opacity',
                draggingIdx === i ? 'opacity-40' : '',
              ].join(' ')}
              draggable={slot !== null && modalOpenCount === 0}
              onDragStart={slot !== null && modalOpenCount === 0 ? (e) => handleDragStart(i, e) : undefined}
              onDragEnter={() => handleDragEnter(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              {/* Drop-target highlight ring */}
              {dragOverIdx === i && draggingIdx !== i && (
                <div className="absolute inset-0 ring-2 ring-jobber rounded-lg pointer-events-none z-10" />
              )}

              {slot === null ? (
                <>
                  <button
                    onClick={() => setOpenPickerIndex(openPickerIndex === i ? null : i)}
                    className="w-full h-24 rounded-lg border-2 border-dashed border-jobber/50 hover:border-jobber flex items-center justify-center transition-colors bg-white hover:bg-jobber/5 group"
                    title="Add item to compare"
                  >
                    <span className="text-2xl font-light text-jobber/50 group-hover:text-jobber transition-colors">+</span>
                  </button>
                  {openPickerIndex === i && (
                    <SlotPicker
                      onSelect={selected => {
                        setSlot(i, selected);
                        setOpenPickerIndex(null);
                      }}
                      onClose={() => setOpenPickerIndex(null)}
                    />
                  )}
                </>
              ) : (
                <SlotCard
                  slot={slot}
                  slotIndex={i}
                  instanceId={block.instanceId}
                  dispatch={dispatch}
                  onClear={() => setSlot(i, null)}
                  onModalOpenChange={handleModalOpenChange}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
