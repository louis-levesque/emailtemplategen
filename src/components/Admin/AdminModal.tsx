import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { AdminAction } from '../../store/adminStore';
import type { PlanDefinition, AddonDefinition, PriceTier, PlanFeature } from '../../types';
import type { Dispatch } from 'react';

interface Props {
  onClose: () => void;
}

// ─── Sortable feature row (plans) ─────────────────────────────────────────────

interface SortableFeatureProps {
  planId: string;
  feature: PlanFeature;
  dispatch: Dispatch<AdminAction>;
}

function SortableFeatureRow({ planId, feature, dispatch }: SortableFeatureProps) {
  const [label, setLabel] = useState(feature.label);
  const [editing, setEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `feat:${planId}:${feature.id}`,
    data: { planId, featureId: feature.id, label: feature.label },
  });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1.5 group rounded px-1 py-0.5 hover:bg-gray-50"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        title="Drag to reorder or move to another plan"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3.5" cy="2.5" r="1.2"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="9.5" r="1.2"/>
          <circle cx="8.5" cy="2.5" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="8.5" cy="9.5" r="1.2"/>
        </svg>
      </button>

      {editing ? (
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => {
            if (label.trim()) {
              dispatch({ type: 'UPDATE_PLAN_FEATURE', planId, featureId: feature.id, label: label.trim() });
            } else {
              setLabel(feature.label);
            }
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { setLabel(feature.label); setEditing(false); }
          }}
          className="flex-1 text-xs border-b border-green-400 outline-none py-0.5 bg-transparent"
        />
      ) : (
        <span
          onClick={() => { setLabel(feature.label); setEditing(true); }}
          className="flex-1 text-xs text-gray-700 cursor-text leading-relaxed"
          title="Click to edit"
        >
          {feature.label}
        </span>
      )}

      <button
        onClick={() => dispatch({ type: 'DELETE_PLAN_FEATURE', planId, featureId: feature.id })}
        className="mt-0.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Delete feature"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Add feature row ──────────────────────────────────────────────────────────

function AddFeatureRow({ planId, dispatch }: { planId: string; dispatch: Dispatch<AdminAction> }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  function submit() {
    const label = value.trim();
    if (!label) return;
    dispatch({ type: 'ADD_PLAN_FEATURE', planId, label });
    setValue('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
      >
        + Add feature
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setValue(''); setOpen(false); } }}
        placeholder="Feature label…"
        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
      />
      <button onClick={submit} disabled={!value.trim()} className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-40">Add</button>
      <button onClick={() => { setValue(''); setOpen(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
    </div>
  );
}

// ─── Tier row ─────────────────────────────────────────────────────────────────

interface TierRowProps {
  planId: string;
  tier: PriceTier;
  tierIndex: number;
  dispatch: Dispatch<AdminAction>;
  canRemove: boolean;
}

function TierRow({ planId, tier, tierIndex, dispatch, canRemove }: TierRowProps) {
  const fields: { field: keyof PriceTier; label: string; placeholder: string }[] = [
    { field: 'monthlyNoCommitment', label: 'Monthly (no commitment)', placeholder: '$99/mo' },
    { field: 'monthlyAnnual',       label: 'Monthly (annual plan)',   placeholder: '$79/mo' },
    { field: 'annualTotal',         label: 'Annual total',            placeholder: '$948/yr' },
    { field: 'annualMonthly',       label: 'Annual (per-mo equiv.)',  placeholder: '($79/mo)' },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">User seats:</span>
          <input
            type="number"
            min={1}
            value={tier.seats}
            onChange={e => dispatch({ type: 'UPDATE_TIER_FIELD', planId, tierIndex, field: 'seats', value: Number(e.target.value) })}
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
        {canRemove && (
          <button
            onClick={() => dispatch({ type: 'REMOVE_TIER', planId, tierIndex })}
            className="text-xs text-red-400 hover:text-red-600 font-medium"
          >
            Remove tier
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {fields.map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
            <input
              value={tier[field] as string}
              onChange={e => dispatch({ type: 'UPDATE_TIER_FIELD', planId, tierIndex, field, value: e.target.value })}
              placeholder={placeholder}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plan editor ──────────────────────────────────────────────────────────────

interface PlanEditorProps {
  plan: PlanDefinition;
  dispatch: Dispatch<AdminAction>;
}

function PlanEditor({ plan, dispatch }: PlanEditorProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `planzone:${plan.id}` });
  const [tiersExpanded, setTiersExpanded] = useState(false);

  function handleDeletePlan() {
    if (window.confirm(`Delete the "${plan.title}" plan? Any canvas blocks using this plan will become empty.`)) {
      dispatch({ type: 'DELETE_PLAN', planId: plan.id });
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Plan header */}
      <div className="px-4 py-3" style={{ backgroundColor: plan.color + '18', borderBottom: `2px solid ${plan.color}40` }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: plan.color }} />
          <input
            value={plan.title}
            onChange={e => dispatch({ type: 'UPDATE_PLAN_META', planId: plan.id, field: 'title', value: e.target.value })}
            className="font-bold text-base bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 outline-none flex-1"
            style={{ color: plan.color }}
          />
          <button
            onClick={handleDeletePlan}
            className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium px-2 py-0.5 rounded border border-transparent hover:border-red-200 hover:bg-red-50 transition-colors"
            title="Delete this plan"
          >
            Delete plan
          </button>
        </div>
        <input
          value={plan.tagline}
          onChange={e => dispatch({ type: 'UPDATE_PLAN_META', planId: plan.id, field: 'tagline', value: e.target.value })}
          className="text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 outline-none w-full"
          placeholder="Plan tagline…"
        />
      </div>

      {/* Pricing tiers — collapsible */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setTiersExpanded(x => !x)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50"
        >
          <span>Pricing Tiers ({plan.tiers.length})</span>
          <span className="text-gray-300">{tiersExpanded ? '▲' : '▼'}</span>
        </button>
        {tiersExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {plan.tiers.map((tier, i) => (
              <TierRow
                key={i}
                planId={plan.id}
                tier={tier}
                tierIndex={i}
                dispatch={dispatch}
                canRemove={plan.tiers.length > 1}
              />
            ))}
            <button
              onClick={() => dispatch({ type: 'ADD_TIER', planId: plan.id })}
              className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mt-1"
            >
              + Add tier
            </button>
          </div>
        )}
      </div>

      {/* Features drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 px-4 py-3 transition-colors ${isOver ? 'bg-green-50 ring-2 ring-inset ring-green-300' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Features ({plan.features.length})
          </span>
          {isOver && (
            <span className="text-xs text-green-600 font-medium animate-pulse">Drop here →</span>
          )}
        </div>
        <SortableContext
          items={plan.features.map(f => `feat:${plan.id}:${f.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1">
            {plan.features.map(feature => (
              <SortableFeatureRow
                key={feature.id}
                planId={plan.id}
                feature={feature}
                dispatch={dispatch}
              />
            ))}
          </div>
        </SortableContext>
        <AddFeatureRow planId={plan.id} dispatch={dispatch} />
      </div>
    </div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────

interface PlansTabProps {
  plans: PlanDefinition[];
  dispatch: Dispatch<AdminAction>;
}

function PlansTab({ plans, dispatch }: PlansTabProps) {
  const [activeFeatureDrag, setActiveFeatureDrag] = useState<{ label: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data) setActiveFeatureDrag({ label: data.label as string });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveFeatureDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith('feat:')) return;

    // Parse "feat:planId:featureId"
    const [, fromPlanId, featureId] = activeId.split(':');

    let toPlanId: string;
    let toFeatureId: string | null = null;

    if (overId.startsWith('feat:')) {
      const [, overPlanId, overFeatureId] = overId.split(':');
      toPlanId = overPlanId;
      toFeatureId = overFeatureId;
    } else if (overId.startsWith('planzone:')) {
      toPlanId = overId.slice('planzone:'.length);
    } else {
      return;
    }

    if (fromPlanId === toPlanId) {
      // Same plan → reorder
      const plan = plans.find(p => p.id === fromPlanId);
      if (!plan) return;
      const fromIndex = plan.features.findIndex(f => f.id === featureId);
      const toIndex = toFeatureId !== null
        ? plan.features.findIndex(f => f.id === toFeatureId)
        : plan.features.length - 1;
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        dispatch({ type: 'REORDER_PLAN_FEATURES', planId: fromPlanId, fromIndex, toIndex });
      }
    } else {
      // Cross-plan → move
      dispatch({ type: 'MOVE_PLAN_FEATURE', fromPlanId, toPlanId, featureId });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <p className="text-xs text-gray-400 mb-4">
        Click any field to edit inline. Drag a feature's <span className="font-semibold">⠿</span> handle to reorder it, or drag it onto another plan to move it there.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {plans.map(plan => (
          <PlanEditor key={plan.id} plan={plan} dispatch={dispatch} />
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'ADD_PLAN' })}
        className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl text-sm font-semibold text-gray-400 hover:text-green-600 transition-colors"
      >
        + Add New Plan
      </button>
      <DragOverlay>
        {activeFeatureDrag && (
          <div className="bg-white border border-green-400 shadow-lg rounded-full px-3 py-1 text-xs font-semibold text-green-700 cursor-grabbing">
            {activeFeatureDrag.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Sortable addon feature row ───────────────────────────────────────────────

interface SortableAddonFeatureProps {
  addonId: string;
  feature: PlanFeature;
  dispatch: Dispatch<AdminAction>;
}

function SortableAddonFeatureRow({ addonId, feature, dispatch }: SortableAddonFeatureProps) {
  const [label, setLabel] = useState(feature.label);
  const [editing, setEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `addonfeat:${addonId}:${feature.id}`,
    data: { label: feature.label },
  });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1.5 group rounded px-1 py-0.5 hover:bg-gray-50"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        title="Drag to reorder"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3.5" cy="2.5" r="1.2"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="9.5" r="1.2"/>
          <circle cx="8.5" cy="2.5" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="8.5" cy="9.5" r="1.2"/>
        </svg>
      </button>
      {editing ? (
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => {
            if (label.trim()) {
              dispatch({ type: 'UPDATE_ADDON_FEATURE', addonId, featureId: feature.id, label: label.trim() });
            } else {
              setLabel(feature.label);
            }
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { setLabel(feature.label); setEditing(false); }
          }}
          className="flex-1 text-xs border-b border-green-400 outline-none py-0.5 bg-transparent"
        />
      ) : (
        <span
          onClick={() => { setLabel(feature.label); setEditing(true); }}
          className="flex-1 text-xs text-gray-700 cursor-text leading-relaxed"
          title="Click to edit"
        >
          {feature.label}
        </span>
      )}
      <button
        onClick={() => dispatch({ type: 'DELETE_ADDON_FEATURE', addonId, featureId: feature.id })}
        className="mt-0.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Addon editor ─────────────────────────────────────────────────────────────

interface AddonEditorProps {
  addon: AddonDefinition;
  dispatch: Dispatch<AdminAction>;
}

function AddonEditor({ addon, dispatch }: AddonEditorProps) {
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureLabel, setNewFeatureLabel] = useState('');
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);

  const addonSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function submitFeature() {
    const label = newFeatureLabel.trim();
    if (!label) return;
    dispatch({ type: 'ADD_ADDON_FEATURE', addonId: addon.id, label });
    setNewFeatureLabel('');
    setAddingFeature(false);
  }

  function handleDeleteAddon() {
    if (window.confirm(`Delete the "${addon.name}" add-on? Any canvas blocks using this add-on will become empty.`)) {
      dispatch({ type: 'DELETE_ADDON', addonId: addon.id });
    }
  }

  function handleAddonDragStart(event: DragStartEvent) {
    setActiveDragLabel(event.active.data.current?.label as string ?? null);
  }

  function handleAddonDragEnd(event: DragEndEvent) {
    setActiveDragLabel(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith('addonfeat:') || !overId.startsWith('addonfeat:')) return;
    const fromFeatureId = activeId.split(':')[2];
    const toFeatureId = overId.split(':')[2];
    const fromIndex = addon.features.findIndex(f => f.id === fromFeatureId);
    const toIndex = addon.features.findIndex(f => f.id === toFeatureId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_ADDON_FEATURES', addonId: addon.id, fromIndex, toIndex });
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <input
            value={addon.name}
            onChange={e => dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'name', value: e.target.value })}
            className="font-semibold text-sm text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 outline-none flex-1"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-400">Price:</span>
            <input
              value={addon.price}
              onChange={e => dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'price', value: e.target.value })}
              className="w-24 text-xs font-bold text-green-700 bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400 text-right"
              placeholder="$0/mo"
            />
          </div>
          <button
            onClick={handleDeleteAddon}
            className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium px-2 py-0.5 rounded border border-transparent hover:border-red-200 hover:bg-red-50 transition-colors"
            title="Delete this add-on"
          >
            Delete
          </button>
        </div>
        <textarea
          value={addon.description}
          onChange={e => dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'description', value: e.target.value })}
          rows={2}
          className="mt-1 w-full text-xs text-gray-500 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5 outline-none resize-none focus:ring-1 focus:ring-green-400"
          placeholder="Add-on description…"
        />
      </div>

      {/* Features */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features ({addon.features.length})</p>
        <DndContext
          sensors={addonSensors}
          collisionDetection={closestCenter}
          onDragStart={handleAddonDragStart}
          onDragEnd={handleAddonDragEnd}
        >
          <SortableContext
            items={addon.features.map(f => `addonfeat:${addon.id}:${f.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {addon.features.map(f => (
                <SortableAddonFeatureRow key={f.id} addonId={addon.id} feature={f} dispatch={dispatch} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragLabel && (
              <div className="bg-white border border-green-400 shadow-lg rounded-full px-3 py-1 text-xs font-semibold text-green-700 cursor-grabbing">
                {activeDragLabel}
              </div>
            )}
          </DragOverlay>
        </DndContext>
        {addingFeature ? (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={newFeatureLabel}
              onChange={e => setNewFeatureLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitFeature(); if (e.key === 'Escape') { setNewFeatureLabel(''); setAddingFeature(false); } }}
              placeholder="Feature description…"
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button onClick={submitFeature} disabled={!newFeatureLabel.trim()} className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-40">Add</button>
            <button onClick={() => { setNewFeatureLabel(''); setAddingFeature(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingFeature(true)}
            className="mt-2 text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
          >
            + Add feature
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add-ons tab ──────────────────────────────────────────────────────────────

function AddonsTab({ addons, dispatch }: { addons: AddonDefinition[]; dispatch: Dispatch<AdminAction> }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Click any field to edit inline. Drag a feature's <span className="font-semibold">⠿</span> handle to reorder it.</p>
      <div className="grid grid-cols-2 gap-4">
        {addons.map(addon => (
          <AddonEditor key={addon.id} addon={addon} dispatch={dispatch} />
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'ADD_ADDON' })}
        className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl text-sm font-semibold text-gray-400 hover:text-green-600 transition-colors"
      >
        + Add New Add-on
      </button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AdminModal({ onClose }: Props) {
  const [tab, setTab] = useState<'plans' | 'addons'>('plans');
  const { plans, addons, adminDispatch, isDirty, save, cancel, resetToDefaults } = useAdminData();

  function handleReset() {
    if (window.confirm('Reset all pricing and features to the original defaults? This cannot be undone.')) {
      resetToDefaults();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Admin — Pricing &amp; Features</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDirty
                ? 'You have unsaved changes. Save to persist or Cancel to revert.'
                : 'All changes saved. Edits apply live to the canvas.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cancel Changes */}
            <button
              onClick={cancel}
              disabled={!isDirty}
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                isDirty
                  ? 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  : 'text-gray-300 border-gray-200 cursor-not-allowed'
              }`}
            >
              Cancel Changes
            </button>
            {/* Save Changes */}
            <button
              onClick={save}
              disabled={!isDirty}
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                isDirty
                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                  : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
            {/* Reset to Defaults */}
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['plans', 'addons'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'plans' ? 'Plans' : 'Add-ons'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'plans' && <PlansTab plans={plans} dispatch={adminDispatch} />}
          {tab === 'addons' && <AddonsTab addons={addons} dispatch={adminDispatch} />}
        </div>
      </div>
    </div>
  );
}
