import { useState, useEffect, useRef, type Dispatch } from 'react';
import type { CompareBlock as CompareBlockType, CompareSlot, PricingKey } from '../../types';
import { ALL_PRICING_KEYS } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { stripLinkSyntax } from '../../utils/generateEmailHtml';
import { FeatureBuckets } from './FeatureBuckets';
import { PromoModal, type PromoRow } from './PromoModal';
import { PRICING_LABELS, formatValidUntil } from '../../utils/priceUtils';

interface Props {
  block: CompareBlockType;
  dispatch: Dispatch<CanvasAction>;
}

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
      visiblePricingKeys: [...ALL_PRICING_KEYS],
      promotions: {},
    });
  }

  function handleSelectAddon(addonId: string) {
    const addon = addons.find(a => a.id === addonId);
    if (!addon) return;
    onSelect({
      kind: 'addon',
      definitionId: addon.id,
      visibleFeatureIds: addon.features.map(f => f.id),
      keyFeatureIds: [],
      promo: null,
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

interface SlotCardProps {
  slot: CompareSlot;
  onClear: () => void;
  onEdit: () => void;
}

function SlotCard({ slot, onClear, onEdit }: SlotCardProps) {
  const { plans, addons } = useAdminData();

  const hasPromo =
    slot.kind === 'plan'
      ? Object.keys(slot.promotions ?? {}).length > 0
      : slot.promo != null;

  if (slot.kind === 'plan') {
    const def = plans.find(p => p.id === slot.definitionId);
    if (!def) return null;
    const tier = def.tiers.find(t => t.seats === slot.selectedSeats) ?? def.tiers[0];
    const price = tier.monthlyNoCommitment;
    const visibleFeatures = def.features.filter(f => slot.visibleFeatureIds.includes(f.id));

    return (
      <div className="rounded-lg overflow-hidden border flex flex-col" style={{ borderColor: def.color }}>
        {/* Header */}
        <div className="relative px-3 py-2 text-white" style={{ backgroundColor: def.color }}>
          <div className="absolute top-1 right-1 flex items-center gap-0.5">
            {hasPromo && (
              <span className="w-2 h-2 rounded-full bg-amber-300 flex-shrink-0" title="Promotion active" />
            )}
            <button
              onClick={onEdit}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
              title="Edit"
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 1.5l2 2L3 9H1V7L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={onClear}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xs font-bold transition-colors"
              title="Remove"
            >
              ×
            </button>
          </div>
          <div className="font-semibold text-sm pr-14 truncate">{def.title}</div>
          <div className="text-xs opacity-80 font-bold mt-0.5">{price}</div>
        </div>
        {/* Features */}
        <div className="px-2 py-2 bg-white flex-1">
          {visibleFeatures.slice(0, 5).map(f => (
            <div key={f.id} className="flex items-start gap-1 py-0.5">
              <span className="text-xs mt-0.5" style={{ color: def.color }}>✓</span>
              <span className="text-xs text-gray-600 leading-snug">{stripLinkSyntax(f.label)}</span>
            </div>
          ))}
          {visibleFeatures.length > 5 && (
            <div className="text-xs text-gray-400 mt-1">+{visibleFeatures.length - 5} more</div>
          )}
          {visibleFeatures.length === 0 && (
            <div className="text-xs text-gray-400 italic">No features shown</div>
          )}
        </div>
      </div>
    );
  }

  // addon
  const def = addons.find(a => a.id === slot.definitionId);
  if (!def) return null;
  const visibleFeatures = def.features.filter(f => slot.visibleFeatureIds.includes(f.id));

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 flex flex-col">
      {/* Header */}
      <div className="relative px-3 py-2 bg-gray-500 text-white">
        <div className="absolute top-1 right-1 flex items-center gap-0.5">
          {hasPromo && (
            <span className="w-2 h-2 rounded-full bg-amber-300 flex-shrink-0" title="Promotion active" />
          )}
          <button
            onClick={onEdit}
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
            title="Edit"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 1.5l2 2L3 9H1V7L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onClear}
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xs font-bold transition-colors"
            title="Remove"
          >
            ×
          </button>
        </div>
        <div className="font-semibold text-sm pr-14 truncate">{def.name}</div>
        <div className="text-xs opacity-80 font-bold mt-0.5">{def.price}</div>
      </div>
      {/* Features */}
      <div className="px-2 py-2 bg-white flex-1">
        {visibleFeatures.slice(0, 5).map(f => (
          <div key={f.id} className="flex items-start gap-1 py-0.5">
            <span className="text-xs mt-0.5 text-gray-500">✓</span>
            <span className="text-xs text-gray-600 leading-snug">{stripLinkSyntax(f.label)}</span>
          </div>
        ))}
        {visibleFeatures.length > 5 && (
          <div className="text-xs text-gray-400 mt-1">+{visibleFeatures.length - 5} more</div>
        )}
        {visibleFeatures.length === 0 && (
          <div className="text-xs text-gray-400 italic">No features shown</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareSlotEditorModal
// ---------------------------------------------------------------------------

interface EditorModalProps {
  slot: CompareSlot;
  onSave: (updated: CompareSlot) => void;
  onClose: () => void;
}

function CompareSlotEditorModal({ slot, onSave, onClose }: EditorModalProps) {
  const { plans, addons } = useAdminData();

  // ---- local state ----
  const [visibleFeatureIds, setVisibleFeatureIds] = useState<string[]>(slot.visibleFeatureIds);
  const [keyFeatureIds, setKeyFeatureIds] = useState<string[]>(slot.keyFeatureIds);
  const [showPromoModal, setShowPromoModal] = useState(false);

  // plan-only state
  const [selectedSeats, setSelectedSeats] = useState<number>(
    slot.kind === 'plan' ? slot.selectedSeats : 0
  );
  const [visiblePricingKeys, setVisiblePricingKeys] = useState<PricingKey[]>(
    slot.kind === 'plan' ? (slot.visiblePricingKeys ?? ['monthlyNoCommitment']) : []
  );
  const [promotions, setPromotions] = useState<Partial<Record<PricingKey, import('../../types').PromoConfig>>>(
    slot.kind === 'plan' ? (slot.promotions ?? {}) : {}
  );
  const [promoValidUntil, setPromoValidUntil] = useState<string | undefined>(
    slot.kind === 'plan' ? slot.promoValidUntil : undefined
  );

  // addon-only state
  const [addonPromo, setAddonPromo] = useState<import('../../types').PromoConfig | null>(
    slot.kind === 'addon' ? (slot.promo ?? null) : null
  );
  const [addonPromoValidUntil, setAddonPromoValidUntil] = useState<string | undefined>(
    slot.kind === 'addon' ? slot.promoValidUntil : undefined
  );

  // ---- close on Escape ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showPromoModal) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showPromoModal]);

  function handleSetBucket(featureId: string, bucket: 'key' | 'included' | 'hidden') {
    if (bucket === 'key') {
      setVisibleFeatureIds(ids => ids.includes(featureId) ? ids : [...ids, featureId]);
      setKeyFeatureIds(ids => ids.includes(featureId) ? ids : [...ids, featureId]);
    } else if (bucket === 'included') {
      setVisibleFeatureIds(ids => ids.includes(featureId) ? ids : [...ids, featureId]);
      setKeyFeatureIds(ids => ids.filter(id => id !== featureId));
    } else {
      setVisibleFeatureIds(ids => ids.filter(id => id !== featureId));
      setKeyFeatureIds(ids => ids.filter(id => id !== featureId));
    }
  }

  function handleSave() {
    if (slot.kind === 'plan') {
      onSave({
        kind: 'plan',
        definitionId: slot.definitionId,
        selectedSeats,
        visibleFeatureIds,
        keyFeatureIds,
        visiblePricingKeys,
        promotions,
        promoValidUntil,
      });
    } else {
      onSave({
        kind: 'addon',
        definitionId: slot.definitionId,
        visibleFeatureIds,
        keyFeatureIds,
        promo: addonPromo,
        promoValidUntil: addonPromoValidUntil,
      });
    }
    onClose();
  }

  // ---- derive definition info ----
  if (slot.kind === 'plan') {
    const def = plans.find(p => p.id === slot.definitionId);
    if (!def) return null;

    const selectedTier = def.tiers.find(t => t.seats === selectedSeats) ?? def.tiers[0];
    const hasAnyPromo = Object.keys(promotions).length > 0;

    const promoRows: PromoRow[] = ALL_PRICING_KEYS.map(key => ({
      key,
      label: PRICING_LABELS[key],
      originalPrice: selectedTier[key],
    }));

    return (
      <>
        <div
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg mx-4 overflow-hidden" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: def.color }} />
                <h2 className="text-sm font-bold text-gray-800">{def.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg font-light"
              >×</button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

              {/* Seat selector */}
              {def.tiers.length > 1 && (
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">User seats</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {def.tiers.map(tier => (
                      <button
                        key={tier.seats}
                        onClick={() => setSelectedSeats(tier.seats)}
                        className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                        style={
                          selectedSeats === tier.seats
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

              {/* Pricing visibility */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing visibility</p>
                <div className="space-y-1.5">
                  {ALL_PRICING_KEYS.map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-jobber"
                        checked={visiblePricingKeys.includes(key)}
                        onChange={() => {
                          setVisiblePricingKeys(keys =>
                            keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]
                          );
                        }}
                      />
                      <span className="text-xs text-gray-600">{PRICING_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Promotions */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Promotion</p>
                  <button
                    onClick={() => setShowPromoModal(true)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                      hasAnyPromo
                        ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                      <path d="M1 5.5h9M5.5 1v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {hasAnyPromo ? 'Edit Promotion' : 'Add Promotion'}
                  </button>
                </div>
                {hasAnyPromo && promoValidUntil && (
                  <p className="text-xs text-amber-700 mt-2">
                    Promotional pricing valid until {formatValidUntil(promoValidUntil)}.
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Features</p>
                <FeatureBuckets
                  allFeatures={def.features}
                  visibleFeatureIds={visibleFeatureIds}
                  keyFeatureIds={keyFeatureIds}
                  onSetBucket={handleSetBucket}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold bg-jobber text-jobber-dark rounded-lg hover:opacity-90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {showPromoModal && (
          <PromoModal
            title={`${def.title} — ${selectedTier.seats} ${selectedTier.seats === 1 ? 'user' : 'users'}`}
            rows={promoRows}
            initialPromos={promotions}
            initialValidUntil={promoValidUntil}
            onSave={(promos, validUntil) => {
              setPromotions(promos as Partial<Record<PricingKey, import('../../types').PromoConfig>>);
              setPromoValidUntil(validUntil ?? undefined);
            }}
            onClose={() => setShowPromoModal(false)}
          />
        )}
      </>
    );
  }

  // addon
  const def = addons.find(a => a.id === slot.definitionId);
  if (!def) return null;

  const hasPromo = addonPromo != null;

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg mx-4 overflow-hidden" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-800">{def.name}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg font-light"
            >×</button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

            {/* Promotions */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Promotion</p>
                <button
                  onClick={() => setShowPromoModal(true)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    hasPromo
                      ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                    <path d="M1 5.5h9M5.5 1v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {hasPromo ? 'Edit Promotion' : 'Add Promotion'}
                </button>
              </div>
              {hasPromo && addonPromoValidUntil && (
                <p className="text-xs text-amber-700 mt-2">
                  Promotional pricing valid until {formatValidUntil(addonPromoValidUntil)}.
                </p>
              )}
            </div>

            {/* Features */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Features</p>
              <FeatureBuckets
                allFeatures={def.features}
                visibleFeatureIds={visibleFeatureIds}
                keyFeatureIds={keyFeatureIds}
                onSetBucket={handleSetBucket}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold bg-jobber text-jobber-dark rounded-lg hover:opacity-90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {showPromoModal && (
        <PromoModal
          title={def.name}
          rows={[{ key: 'price', label: def.name, originalPrice: def.price }]}
          initialPromos={addonPromo ? { price: addonPromo } : {}}
          initialValidUntil={addonPromoValidUntil}
          onSave={(promos, validUntil) => {
            const p = promos['price'] ?? null;
            setAddonPromo(p as import('../../types').PromoConfig | null);
            setAddonPromoValidUntil(validUntil ?? undefined);
          }}
          onClose={() => setShowPromoModal(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main CompareBlock component
// ---------------------------------------------------------------------------

export function CompareBlock({ block, dispatch }: Props) {
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  function setSlot(slotIndex: number, slot: CompareSlot | null) {
    dispatch({ type: 'SET_COMPARE_SLOT', instanceId: block.instanceId, slotIndex, slot });
  }

  const editingSlot =
    editingSlotIndex !== null ? block.slots[editingSlotIndex] ?? null : null;

  return (
    <>
      <div className="p-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50">
          {/* Block header */}
          <div className="px-4 py-2 border-b border-gray-200 bg-white rounded-t-lg flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Compare</span>
            <span className="text-xs text-gray-400">— up to 3 plans or add-ons side by side</span>
          </div>

          {/* Slots */}
          <div className="flex gap-2 p-3">
            {block.slots.map((slot, i) => (
              <div key={i} className="flex-1 relative">
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
                        onSelect={slot => {
                          setSlot(i, slot);
                          setOpenPickerIndex(null);
                        }}
                        onClose={() => setOpenPickerIndex(null)}
                      />
                    )}
                  </>
                ) : (
                  <SlotCard
                    slot={slot}
                    onClear={() => setSlot(i, null)}
                    onEdit={() => setEditingSlotIndex(i)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingSlotIndex !== null && editingSlot !== null && (
        <CompareSlotEditorModal
          slot={editingSlot}
          onSave={updated => {
            setSlot(editingSlotIndex, updated);
            setEditingSlotIndex(null);
          }}
          onClose={() => setEditingSlotIndex(null)}
        />
      )}
    </>
  );
}
