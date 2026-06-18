import { useState, useEffect, useRef, type Dispatch } from 'react';
import type { CompareBlock as CompareBlockType, CompareSlot } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { stripLinkSyntax } from '../../utils/generateEmailHtml';

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
      visiblePricingKeys: ['monthlyNoCommitment'],
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
}

function SlotCard({ slot, onClear }: SlotCardProps) {
  const { plans, addons } = useAdminData();

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
          <button
            onClick={onClear}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xs font-bold transition-colors"
            title="Remove"
          >
            ×
          </button>
          <div className="font-semibold text-sm pr-5 truncate">{def.title}</div>
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
        <button
          onClick={onClear}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xs font-bold transition-colors"
          title="Remove"
        >
          ×
        </button>
        <div className="font-semibold text-sm pr-5 truncate">{def.name}</div>
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

export function CompareBlock({ block, dispatch }: Props) {
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);

  function setSlot(slotIndex: number, slot: CompareSlot | null) {
    dispatch({ type: 'SET_COMPARE_SLOT', instanceId: block.instanceId, slotIndex, slot });
  }

  return (
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
                <SlotCard slot={slot} onClear={() => setSlot(i, null)} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
