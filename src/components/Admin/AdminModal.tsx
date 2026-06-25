import { useState, useRef, useEffect } from 'react';
import { isValidHttpUrl } from '../../utils/sanitize';
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
import type { PlanDefinition, AddonDefinition, PriceTier, PlanFeature, AddonPriceTier, PlanPricingOption, JobberPaymentsDefinition, PaymentRate, OnboardingLinksDefinition } from '../../types';
import type { Dispatch } from 'react';

interface Props {
  onClose: () => void;
}

// ─── Small shared helpers ─────────────────────────────────────────────────────

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'currentColor'} strokeWidth="1.2">
      <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13.2 7,10.8 3,13.2 4,8.6 0.6,5.6 5.2,5.2" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M5 7a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24L5.88 2.38" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 5a3 3 0 0 0-4.24 0L1.26 6.5a3 3 0 0 0 4.24 4.24L6.12 9.62" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

/** Renders [text](url) as a blue link in JSX, for non-editing display in the admin modal. */
function RichLabel({ text }: { text: string }) {
  if (!text.includes('[')) return <>{text}</>;
  const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a key={match.index} href={match[2]} target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-700">
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

interface InsertLinkInlineProps {
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
  defaultText?: string;
}

/** Compact form to build a [text](url) string. */
function InsertLinkInline({ onInsert, onClose, defaultText = '' }: InsertLinkInlineProps) {
  const [text, setText] = useState(defaultText);
  const [url, setUrl] = useState('');

  function commit() {
    const t = text.trim();
    const rawUrl = url.trim();
    if (!t || !rawUrl) return;
    const finalUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    onInsert(t, finalUrl);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm space-y-1.5">
      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><LinkIcon /> Insert Link</p>
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Display text"
        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
      />
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose(); }}
        placeholder="https://getjobber.com/..."
        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
      />
      <div className="flex gap-1.5">
        <button
          onClick={commit}
          disabled={!text.trim() || !url.trim()}
          className="px-2.5 py-1 text-xs font-semibold bg-jobber text-jobber-dark rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Insert
        </button>
        <button onClick={onClose} className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Sortable feature row (plans) ─────────────────────────────────────────────

interface SortableFeatureProps {
  planId: string;
  feature: PlanFeature;
  isDefaultKey: boolean;
  dispatch: Dispatch<AdminAction>;
}

function SortableFeatureRow({ planId, feature, isDefaultKey, dispatch }: SortableFeatureProps) {
  const [label, setLabel] = useState(feature.label);
  const [editing, setEditing] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedSelRef = useRef({ start: 0, end: 0 });
  const linkFormOpenRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `feat:${planId}:${feature.id}`,
    data: { planId, featureId: feature.id, label: feature.label },
  });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  function commitEdit() {
    if (linkFormOpenRef.current) return;
    setEditing(false);
    if (label.trim()) {
      dispatch({ type: 'UPDATE_PLAN_FEATURE', planId, featureId: feature.id, label: label.trim() });
    } else {
      setLabel(feature.label);
    }
  }

  function openLinkForm() {
    if (!editing) {
      setLabel(feature.label);
      setEditing(true);
      savedSelRef.current = { start: feature.label.length, end: feature.label.length };
    } else {
      const el = inputRef.current;
      savedSelRef.current = {
        start: el?.selectionStart ?? label.length,
        end: el?.selectionEnd ?? label.length,
      };
    }
    linkFormOpenRef.current = true;
    setShowLinkForm(true);
  }

  function handleInsertLink(text: string, url: string) {
    const insertion = `[${text}](${url})`;
    const { start, end } = savedSelRef.current;
    const newLabel = label.slice(0, start) + insertion + label.slice(end);
    setLabel(newLabel);
    dispatch({ type: 'UPDATE_PLAN_FEATURE', planId, featureId: feature.id, label: newLabel.trim() });
    linkFormOpenRef.current = false;
    setShowLinkForm(false);
    setEditing(false);
  }

  function handleCancelLink() {
    linkFormOpenRef.current = false;
    setShowLinkForm(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1.5 group rounded px-1 py-0.5 hover:bg-gray-50">
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

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { linkFormOpenRef.current = false; commitEdit(); }
                if (e.key === 'Escape') { setLabel(feature.label); setEditing(false); setShowLinkForm(false); linkFormOpenRef.current = false; }
              }}
              className="w-full text-xs border-b border-jobber outline-none py-0.5 bg-transparent"
            />
          ) : (
            <span
              onClick={() => { setLabel(feature.label); setEditing(true); }}
              className="block text-xs text-gray-700 cursor-text leading-relaxed"
              title="Click to edit"
            >
              <RichLabel text={feature.label} />
            </span>
          )}
        </div>

        {/* Default key feature star toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_DEFAULT_KEY_FEATURE', planId, featureId: feature.id })}
          className={`mt-0.5 flex-shrink-0 transition-colors ${isDefaultKey ? 'text-amber-400' : 'text-gray-200 opacity-0 group-hover:opacity-100 hover:text-amber-300'}`}
          title={isDefaultKey ? 'Remove as default key feature' : 'Mark as default key feature'}
        >
          <StarIcon filled={isDefaultKey} />
        </button>

        {/* Link button */}
        <button
          onMouseDown={editing ? (e => e.preventDefault()) : undefined}
          onClick={openLinkForm}
          className="mt-0.5 text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Insert link"
        >
          <LinkIcon />
        </button>

        {/* Delete button */}
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

      {showLinkForm && (
        <div className="px-1 pb-1.5">
          <InsertLinkInline onInsert={handleInsertLink} onClose={handleCancelLink} />
        </div>
      )}
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
        className="mt-2 text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1"
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
        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
      />
      <button onClick={submit} disabled={!value.trim()} className="text-xs bg-jobber text-jobber-dark px-2 py-1 rounded disabled:opacity-40">Add</button>
      <button onClick={() => { setValue(''); setOpen(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
    </div>
  );
}

// ─── Sortable pricing option row (plans) ──────────────────────────────────────

interface SortablePricingOptionRowProps {
  planId: string;
  option: PlanPricingOption;
  dispatch: Dispatch<AdminAction>;
  canRemove: boolean;
}

function SortablePricingOptionRow({ planId, option, dispatch, canRemove }: SortablePricingOptionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        title="Drag to reorder"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3.5" cy="2.5" r="1.2"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="9.5" r="1.2"/>
          <circle cx="8.5" cy="2.5" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="8.5" cy="9.5" r="1.2"/>
        </svg>
      </button>
      <input
        value={option.label}
        onChange={e => dispatch({ type: 'UPDATE_PRICING_OPTION', planId, optionId: option.id, label: e.target.value })}
        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
        placeholder="e.g. No commitment, billed monthly"
      />
      {canRemove && (
        <button
          onClick={() => dispatch({ type: 'REMOVE_PRICING_OPTION', planId, optionId: option.id })}
          className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0"
          title="Remove pricing option"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Sortable tier row (plans) ────────────────────────────────────────────────

interface TierRowProps {
  planId: string;
  tier: PriceTier;
  tierIndex: number;
  pricingOptions: PlanPricingOption[];
  dispatch: Dispatch<AdminAction>;
  canRemove: boolean;
}

function SortableTierRow({ planId, tier, tierIndex, pricingOptions, dispatch, canRemove }: TierRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `tier:${planId}:${tierIndex}:${tier.seats}` });
  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
            title="Drag to reorder"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="3.5" cy="2.5" r="1.2"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="9.5" r="1.2"/>
              <circle cx="8.5" cy="2.5" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="8.5" cy="9.5" r="1.2"/>
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-500">User seats:</span>
          <input
            type="text"
            value={tier.seats === 'unlimited' ? 'Unlimited' : String(tier.seats)}
            onChange={e => {
              const v = e.target.value.trim().toLowerCase();
              if (v === 'unlimited') {
                dispatch({ type: 'UPDATE_TIER_SEATS', planId, tierIndex, seats: 'unlimited' });
              } else {
                const n = parseInt(v, 10);
                if (!isNaN(n) && n > 0) dispatch({ type: 'UPDATE_TIER_SEATS', planId, tierIndex, seats: n });
              }
            }}
            placeholder="e.g. 5 or Unlimited"
            className="w-24 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
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
      <div className="space-y-2">
        {pricingOptions.map(opt => {
          const entry = tier.prices[opt.id] ?? { price: '$0/mo' };
          return (
            <div key={opt.id} className="border border-gray-100 rounded p-2 bg-white">
              <p className="text-xs font-semibold text-gray-500 mb-1.5 truncate">{opt.label}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Price</label>
                  <input
                    value={entry.price}
                    onChange={e => dispatch({ type: 'UPDATE_TIER_PRICE', planId, tierIndex, optionId: opt.id, field: 'price', value: e.target.value })}
                    placeholder="$99/mo"
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Monthly equiv.</label>
                  <input
                    value={entry.monthlyEquivalent ?? ''}
                    onChange={e => dispatch({ type: 'UPDATE_TIER_PRICE', planId, tierIndex, optionId: opt.id, field: 'monthlyEquivalent', value: e.target.value })}
                    placeholder="$79/mo"
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                  />
                </div>
              </div>
            </div>
          );
        })}
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
  const [showTaglineLinkForm, setShowTaglineLinkForm] = useState(false);
  const taglineRef = useRef<HTMLInputElement>(null);
  const taglineSelRef = useRef({ start: 0, end: 0 });

  const optionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const tierSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleTierDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const tierIds = plan.tiers.map((t, i) => `tier:${plan.id}:${i}:${t.seats}`);
    const fromIndex = tierIds.indexOf(String(active.id));
    const toIndex = tierIds.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_PLAN_TIERS', planId: plan.id, fromIndex, toIndex });
    }
  }

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = plan.pricingOptions.findIndex(o => o.id === active.id);
    const toIndex = plan.pricingOptions.findIndex(o => o.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_PRICING_OPTIONS', planId: plan.id, fromIndex, toIndex });
    }
  }

  function handleDeletePlan() {
    if (window.confirm(`Delete the "${plan.title}" plan? Any canvas blocks using this plan will become empty.`)) {
      dispatch({ type: 'DELETE_PLAN', planId: plan.id });
    }
  }

  function captureTaglineSel() {
    const el = taglineRef.current;
    if (el) taglineSelRef.current = { start: el.selectionStart ?? plan.tagline.length, end: el.selectionEnd ?? plan.tagline.length };
  }

  function handleTaglineLinkInsert(text: string, url: string) {
    const insertion = `[${text}](${url})`;
    // If cursor never explicitly placed, append to end
    const sel = taglineSelRef.current.start === 0 && taglineSelRef.current.end === 0
      ? { start: plan.tagline.length, end: plan.tagline.length }
      : taglineSelRef.current;
    const newTagline = plan.tagline.slice(0, sel.start) + insertion + plan.tagline.slice(sel.end);
    dispatch({ type: 'UPDATE_PLAN_META', planId: plan.id, field: 'tagline', value: newTagline });
    setShowTaglineLinkForm(false);
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
        <div className="flex items-center gap-1">
          <input
            ref={taglineRef}
            value={plan.tagline}
            onChange={e => dispatch({ type: 'UPDATE_PLAN_META', planId: plan.id, field: 'tagline', value: e.target.value })}
            onSelect={captureTaglineSel}
            onKeyUp={captureTaglineSel}
            className="flex-1 text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 outline-none"
            placeholder="Plan tagline…"
          />
          <button
            onClick={() => { captureTaglineSel(); setShowTaglineLinkForm(true); }}
            className="flex-shrink-0 text-gray-400 hover:text-jobber transition-colors"
            title="Insert link into tagline"
          >
            <LinkIcon />
          </button>
        </div>
      </div>

      {/* Tagline link insert form */}
      {showTaglineLinkForm && (
        <div className="px-4 py-2 border-b border-gray-100">
          <InsertLinkInline onInsert={handleTaglineLinkInsert} onClose={() => setShowTaglineLinkForm(false)} />
        </div>
      )}

      {/* Learn More URL */}
      <div className="px-4 py-2 border-b border-gray-100">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Learn More URL (optional)</label>
        <input
          value={plan.learnMoreUrl ?? ''}
          onChange={e => dispatch({ type: 'UPDATE_PLAN_META', planId: plan.id, field: 'learnMoreUrl', value: e.target.value })}
          className="w-full text-xs text-gray-500 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-jobber"
          placeholder="https://…"
        />
        {plan.learnMoreUrl && !isValidHttpUrl(plan.learnMoreUrl) && (
          <p className="text-[10px] text-red-500 mt-0.5">URL must start with https:// or http://</p>
        )}
      </div>

      {/* Pricing Options — collapsible */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setTiersExpanded(x => !x)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50"
        >
          <span>Pricing Options &amp; Tiers ({plan.pricingOptions.length} options, {plan.tiers.length} seat {plan.tiers.length === 1 ? 'tier' : 'tiers'})</span>
          <span className="text-gray-300">{tiersExpanded ? '▲' : '▼'}</span>
        </button>
        {tiersExpanded && (
          <div className="px-4 pb-3 space-y-3">
            {/* Pricing Options section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 mt-2">Pricing Options</p>
              <DndContext sensors={optionSensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                <SortableContext items={plan.pricingOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {plan.pricingOptions.map(opt => (
                      <SortablePricingOptionRow
                        key={opt.id}
                        planId={plan.id}
                        option={opt}
                        dispatch={dispatch}
                        canRemove={plan.pricingOptions.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                onClick={() => dispatch({ type: 'ADD_PRICING_OPTION', planId: plan.id })}
                className="mt-1.5 text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1"
              >
                + Add pricing option
              </button>
            </div>

            {/* Seat tiers section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Seat Tiers</p>
              <DndContext sensors={tierSensors} collisionDetection={closestCenter} onDragEnd={handleTierDragEnd}>
                <SortableContext
                  items={plan.tiers.map((t, i) => `tier:${plan.id}:${i}:${t.seats}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {plan.tiers.map((tier, i) => (
                      <SortableTierRow
                        key={`${i}:${tier.seats}`}
                        planId={plan.id}
                        tier={tier}
                        tierIndex={i}
                        pricingOptions={plan.pricingOptions}
                        dispatch={dispatch}
                        canRemove={plan.tiers.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                onClick={() => dispatch({ type: 'ADD_TIER', planId: plan.id })}
                className="text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1 mt-1"
              >
                + Add tier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 px-4 py-3 transition-colors ${isOver ? 'bg-jobber/10 ring-2 ring-inset ring-jobber/50' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Features ({plan.features.length})
          </span>
          {isOver && (
            <span className="text-xs text-jobber font-medium animate-pulse">Drop here →</span>
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
                isDefaultKey={plan.defaultKeyFeatureIds?.includes(feature.id) ?? false}
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
        className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-jobber rounded-xl text-sm font-semibold text-gray-400 hover:text-jobber transition-colors"
      >
        + Add New Plan
      </button>
      <DragOverlay>
        {activeFeatureDrag && (
          <div className="bg-white border border-jobber shadow-lg rounded-full px-3 py-1 text-xs font-semibold text-jobber-dark cursor-grabbing">
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
  const [showLinkForm, setShowLinkForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedSelRef = useRef({ start: 0, end: 0 });
  const linkFormOpenRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `addonfeat:${addonId}:${feature.id}`,
    data: { label: feature.label },
  });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  function commitEdit() {
    if (linkFormOpenRef.current) return;
    setEditing(false);
    if (label.trim()) {
      dispatch({ type: 'UPDATE_ADDON_FEATURE', addonId, featureId: feature.id, label: label.trim() });
    } else {
      setLabel(feature.label);
    }
  }

  function openLinkForm() {
    if (!editing) {
      setLabel(feature.label);
      setEditing(true);
      savedSelRef.current = { start: feature.label.length, end: feature.label.length };
    } else {
      const el = inputRef.current;
      savedSelRef.current = {
        start: el?.selectionStart ?? label.length,
        end: el?.selectionEnd ?? label.length,
      };
    }
    linkFormOpenRef.current = true;
    setShowLinkForm(true);
  }

  function handleInsertLink(text: string, url: string) {
    const insertion = `[${text}](${url})`;
    const { start, end } = savedSelRef.current;
    const newLabel = label.slice(0, start) + insertion + label.slice(end);
    setLabel(newLabel);
    dispatch({ type: 'UPDATE_ADDON_FEATURE', addonId, featureId: feature.id, label: newLabel.trim() });
    linkFormOpenRef.current = false;
    setShowLinkForm(false);
    setEditing(false);
  }

  function handleCancelLink() {
    linkFormOpenRef.current = false;
    setShowLinkForm(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1.5 group rounded px-1 py-0.5 hover:bg-gray-50">
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

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { linkFormOpenRef.current = false; commitEdit(); }
                if (e.key === 'Escape') { setLabel(feature.label); setEditing(false); setShowLinkForm(false); linkFormOpenRef.current = false; }
              }}
              className="w-full text-xs border-b border-jobber outline-none py-0.5 bg-transparent"
            />
          ) : (
            <span
              onClick={() => { setLabel(feature.label); setEditing(true); }}
              className="block text-xs text-gray-700 cursor-text leading-relaxed"
              title="Click to edit"
            >
              <RichLabel text={feature.label} />
            </span>
          )}
        </div>

        {/* Link button */}
        <button
          onMouseDown={editing ? (e => e.preventDefault()) : undefined}
          onClick={openLinkForm}
          className="mt-0.5 text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Insert link"
        >
          <LinkIcon />
        </button>

        {/* Delete button */}
        <button
          onClick={() => dispatch({ type: 'DELETE_ADDON_FEATURE', addonId, featureId: feature.id })}
          className="mt-0.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {showLinkForm && (
        <div className="px-1 pb-1.5">
          <InsertLinkInline onInsert={handleInsertLink} onClose={handleCancelLink} />
        </div>
      )}
    </div>
  );
}

// ─── Sortable addon tier row ──────────────────────────────────────────────────

interface AddonTierRowProps {
  addonId: string;
  tier: AddonPriceTier;
  tierIndex: number;
  dispatch: Dispatch<AdminAction>;
  canRemove: boolean;
}

function SortableAddonTierRow({ addonId, tier, tierIndex, dispatch, canRemove }: AddonTierRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `addontier:${addonId}:${tierIndex}:${tier.id}` });
  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
            title="Drag to reorder"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="3.5" cy="2.5" r="1.2"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="9.5" r="1.2"/>
              <circle cx="8.5" cy="2.5" r="1.2"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="8.5" cy="9.5" r="1.2"/>
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-500">Pricing option</span>
        </div>
        {canRemove && (
          <button
            onClick={() => dispatch({ type: 'REMOVE_ADDON_TIER', addonId, tierIndex })}
            className="text-xs text-red-400 hover:text-red-600 font-medium"
          >
            Remove tier
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="col-span-2">
          <label className="text-xs text-gray-400 block mb-0.5">Label</label>
          <input
            value={tier.label}
            onChange={e => dispatch({ type: 'UPDATE_ADDON_TIER', addonId, tierIndex, field: 'label', value: e.target.value })}
            placeholder="e.g. Monthly, no commitment"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Price</label>
          <input
            value={tier.price}
            onChange={e => dispatch({ type: 'UPDATE_ADDON_TIER', addonId, tierIndex, field: 'price', value: e.target.value })}
            placeholder="$29/mo"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Monthly equiv. (annual)</label>
          <input
            value={tier.monthlyEquivalent ?? ''}
            onChange={e => dispatch({ type: 'UPDATE_ADDON_TIER', addonId, tierIndex, field: 'monthlyEquivalent', value: e.target.value })}
            placeholder="($24.17/mo)"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
          />
        </div>
      </div>
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
  const [showDescLinkForm, setShowDescLinkForm] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const descSelRef = useRef({ start: 0, end: 0 });

  const addonSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const addonTierSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleAddonTierDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const tierIds = addon.tiers.map((t, i) => `addontier:${addon.id}:${i}:${t.id}`);
    const fromIndex = tierIds.indexOf(String(active.id));
    const toIndex = tierIds.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_ADDON_TIERS', addonId: addon.id, fromIndex, toIndex });
    }
  }

  function captureDescSel() {
    const el = descRef.current;
    if (el) descSelRef.current = { start: el.selectionStart ?? addon.description.length, end: el.selectionEnd ?? addon.description.length };
  }

  function handleDescLinkInsert(text: string, url: string) {
    const insertion = `[${text}](${url})`;
    const sel = descSelRef.current.start === 0 && descSelRef.current.end === 0
      ? { start: addon.description.length, end: addon.description.length }
      : descSelRef.current;
    const newDesc = addon.description.slice(0, sel.start) + insertion + addon.description.slice(sel.end);
    dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'description', value: newDesc });
    setShowDescLinkForm(false);
  }

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
          <button
            onClick={handleDeleteAddon}
            className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium px-2 py-0.5 rounded border border-transparent hover:border-red-200 hover:bg-red-50 transition-colors"
            title="Delete this add-on"
          >
            Delete
          </button>
        </div>
        <div className="flex items-center justify-between mt-1 mb-0.5">
          <span className="text-xs text-gray-400">Description</span>
          <button
            onClick={() => { captureDescSel(); setShowDescLinkForm(true); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-jobber transition-colors"
            title="Insert link into description"
          >
            <LinkIcon /> <span>Insert Link</span>
          </button>
        </div>
        <textarea
          ref={descRef}
          value={addon.description}
          onChange={e => dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'description', value: e.target.value })}
          onSelect={captureDescSel}
          onKeyUp={captureDescSel}
          rows={2}
          className="mt-1 w-full text-xs text-gray-500 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5 outline-none resize-none focus:ring-1 focus:ring-jobber"
          placeholder="Add-on description…"
        />
        {showDescLinkForm && (
          <div className="mt-1.5">
            <InsertLinkInline onInsert={handleDescLinkInsert} onClose={() => setShowDescLinkForm(false)} />
          </div>
        )}
        <div className="mt-2">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Learn More URL (optional)</label>
          <input
            value={addon.learnMoreUrl ?? ''}
            onChange={e => dispatch({ type: 'UPDATE_ADDON_META', addonId: addon.id, field: 'learnMoreUrl', value: e.target.value })}
            className="w-full text-xs text-gray-500 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-jobber"
            placeholder="https://…"
          />
          {addon.learnMoreUrl && !isValidHttpUrl(addon.learnMoreUrl) && (
            <p className="text-[10px] text-red-500 mt-0.5">URL must start with https:// or http://</p>
          )}
        </div>
      </div>

      {/* Pricing tiers — collapsible */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setPricingExpanded(x => !x)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50"
        >
          <span>Pricing Tiers ({addon.tiers.length})</span>
          <span className="text-gray-300">{pricingExpanded ? '▲' : '▼'}</span>
        </button>
        {pricingExpanded && (
          <div className="px-4 pb-3 space-y-2">
            <DndContext sensors={addonTierSensors} collisionDetection={closestCenter} onDragEnd={handleAddonTierDragEnd}>
              <SortableContext
                items={addon.tiers.map((t, i) => `addontier:${addon.id}:${i}:${t.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {addon.tiers.map((tier, i) => (
                    <SortableAddonTierRow
                      key={`${i}:${tier.id}`}
                      addonId={addon.id}
                      tier={tier}
                      tierIndex={i}
                      dispatch={dispatch}
                      canRemove={addon.tiers.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={() => dispatch({ type: 'ADD_ADDON_TIER', addonId: addon.id })}
              className="text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1 mt-1"
            >
              + Add tier
            </button>
          </div>
        )}
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
              <div className="bg-white border border-jobber shadow-lg rounded-full px-3 py-1 text-xs font-semibold text-jobber-dark cursor-grabbing">
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
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
            />
            <button onClick={submitFeature} disabled={!newFeatureLabel.trim()} className="text-xs bg-jobber text-jobber-dark px-2 py-1 rounded disabled:opacity-40">Add</button>
            <button onClick={() => { setNewFeatureLabel(''); setAddingFeature(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingFeature(true)}
            className="mt-2 text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1"
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
      <p className="text-xs text-gray-400 mb-4">
        Click any field to edit inline. Drag a feature's <span className="font-semibold">⠿</span> handle to reorder it. Use the <span className="font-semibold">link</span> button to insert a link into feature labels or descriptions.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {addons.map(addon => (
          <AddonEditor key={addon.id} addon={addon} dispatch={dispatch} />
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'ADD_ADDON' })}
        className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-jobber rounded-xl text-sm font-semibold text-gray-400 hover:text-jobber transition-colors"
      >
        + Add New Add-on
      </button>
    </div>
  );
}

// ─── Sortable payments feature row ───────────────────────────────────────────

interface SortablePaymentsFeatureProps {
  feature: PlanFeature;
  isDefaultKey: boolean;
  dispatch: Dispatch<AdminAction>;
}

function SortablePaymentsFeatureRow({ feature, isDefaultKey, dispatch }: SortablePaymentsFeatureProps) {
  const [label, setLabel] = useState(feature.label);
  const [editing, setEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `paymentsfeat:${feature.id}`,
    data: { label: feature.label },
  });

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  function commitEdit() {
    setEditing(false);
    if (label.trim()) {
      dispatch({ type: 'UPDATE_PAYMENTS_FEATURE', featureId: feature.id, label: label.trim() });
    } else {
      setLabel(feature.label);
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1.5 group rounded px-1 py-0.5 hover:bg-gray-50">
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

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setLabel(feature.label); setEditing(false); }
              }}
              className="w-full text-xs border-b border-jobber outline-none py-0.5 bg-transparent"
            />
          ) : (
            <span
              onClick={() => { setLabel(feature.label); setEditing(true); }}
              className="block text-xs text-gray-700 cursor-text leading-relaxed"
              title="Click to edit"
            >
              {feature.label}
            </span>
          )}
        </div>

        {/* Default key feature star toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PAYMENTS_DEFAULT_KEY_FEATURE', featureId: feature.id })}
          className={`mt-0.5 flex-shrink-0 transition-colors ${isDefaultKey ? 'text-amber-400' : 'text-gray-200 opacity-0 group-hover:opacity-100 hover:text-amber-300'}`}
          title={isDefaultKey ? 'Remove as default key feature' : 'Mark as default key feature'}
        >
          <StarIcon filled={isDefaultKey} />
        </button>

        {/* Delete button */}
        <button
          onClick={() => dispatch({ type: 'DELETE_PAYMENTS_FEATURE', featureId: feature.id })}
          className="mt-0.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Delete feature"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Payments tab ─────────────────────────────────────────────────────────────

interface PaymentsTabProps {
  def: JobberPaymentsDefinition;
  dispatch: Dispatch<AdminAction>;
}

function PaymentsTab({ def, dispatch }: PaymentsTabProps) {
  const [ratesExpanded, setRatesExpanded] = useState(false);
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureLabel, setNewFeatureLabel] = useState('');
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);

  const featureSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function submitFeature() {
    const label = newFeatureLabel.trim();
    if (!label) return;
    dispatch({ type: 'ADD_PAYMENTS_FEATURE', label });
    setNewFeatureLabel('');
    setAddingFeature(false);
  }

  function handleFeatureDragStart(event: DragStartEvent) {
    setActiveDragLabel(event.active.data.current?.label as string ?? null);
  }

  function handleFeatureDragEnd(event: DragEndEvent) {
    setActiveDragLabel(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith('paymentsfeat:') || !overId.startsWith('paymentsfeat:')) return;
    const fromFeatureId = activeId.split(':')[1];
    const toFeatureId = overId.split(':')[1];
    const fromIndex = def.features.findIndex(f => f.id === fromFeatureId);
    const toIndex = def.features.findIndex(f => f.id === toFeatureId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_PAYMENTS_FEATURES', fromIndex, toIndex });
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Edit the Jobber Payments description, rates, and features. Click a feature to edit inline. Star a feature to make it a default key feature.
      </p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Description */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
          <textarea
            value={def.description}
            onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_DESCRIPTION', description: e.target.value })}
            rows={2}
            className="w-full text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1.5 outline-none resize-none focus:ring-1 focus:ring-jobber"
            placeholder="Payments description…"
          />
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mt-2 mb-1">Learn More URL (optional)</label>
          <input
            value={def.learnMoreUrl ?? ''}
            onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_LEARN_MORE_URL', url: e.target.value })}
            className="w-full text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-jobber"
            placeholder="https://…"
          />
          {def.learnMoreUrl && !isValidHttpUrl(def.learnMoreUrl) && (
            <p className="text-[10px] text-red-500 mt-0.5">URL must start with https:// or http://</p>
          )}
        </div>

        {/* Rates — collapsible */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setRatesExpanded(x => !x)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50"
          >
            <span>Rates &amp; Settings ({def.rates.length} region{def.rates.length !== 1 ? 's' : ''})</span>
            <span className="text-gray-300">{ratesExpanded ? '▲' : '▼'}</span>
          </button>
          {ratesExpanded && (
            <div className="px-4 pb-3 space-y-3">
              {def.rates.map((rate: PaymentRate) => (
                <div key={rate.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Region</span>
                    {def.rates.length > 1 && (
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_PAYMENTS_RATE', rateId: rate.id })}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">Location</label>
                      <input
                        value={rate.location}
                        onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_RATE', rateId: rate.id, field: 'location', value: e.target.value })}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                        placeholder="e.g. Canada & US"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Standard Rate</label>
                        <input
                          value={rate.standardRate}
                          onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_RATE', rateId: rate.id, field: 'standardRate', value: e.target.value })}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                          placeholder="e.g. 2.9% + 30¢"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">Tap to Pay Rate (optional)</label>
                        <input
                          value={rate.tapToPayRate ?? ''}
                          onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_RATE', rateId: rate.id, field: 'tapToPayRate', value: e.target.value })}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                          placeholder="e.g. 2.7% + 30¢"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-0.5">ACH Rate (optional)</label>
                        <input
                          value={rate.achRate ?? ''}
                          onChange={e => dispatch({ type: 'UPDATE_PAYMENTS_RATE', rateId: rate.id, field: 'achRate', value: e.target.value })}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
                          placeholder="e.g. 1%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => dispatch({ type: 'ADD_PAYMENTS_RATE' })}
                className="text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1 mt-1"
              >
                + Add rate
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features ({def.features.length})</p>
          <DndContext
            sensors={featureSensors}
            collisionDetection={closestCenter}
            onDragStart={handleFeatureDragStart}
            onDragEnd={handleFeatureDragEnd}
          >
            <SortableContext
              items={def.features.map(f => `paymentsfeat:${f.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1">
                {def.features.map(f => (
                  <SortablePaymentsFeatureRow
                    key={f.id}
                    feature={f}
                    isDefaultKey={def.defaultKeyFeatureIds?.includes(f.id) ?? false}
                    dispatch={dispatch}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragLabel && (
                <div className="bg-white border border-jobber shadow-lg rounded-full px-3 py-1 text-xs font-semibold text-jobber-dark cursor-grabbing">
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
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
              />
              <button onClick={submitFeature} disabled={!newFeatureLabel.trim()} className="text-xs bg-jobber text-jobber-dark px-2 py-1 rounded disabled:opacity-40">Add</button>
              <button onClick={() => { setNewFeatureLabel(''); setAddingFeature(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingFeature(true)}
              className="mt-2 text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1"
            >
              + Add feature
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Links tab ─────────────────────────────────────────────────────

/** Mini rich-text editor for a pill's content field (snippet code or hyperlink). */
interface PillContentEditorProps {
  pillId: string;
  value: string;
  dispatch: Dispatch<AdminAction>;
}

function PillContentEditor({ pillId, value, dispatch }: PillContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Mount: set initial HTML
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      setIsEmpty(!value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external changes when not focused
  useEffect(() => {
    if (!isFocusedRef.current && editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      setIsEmpty(!value);
    }
  }, [value]);

  function handleInput() {
    const raw = editorRef.current?.innerHTML ?? '';
    const html = raw.replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
    const effectivelyEmpty = html === '' || html === '<br>';
    setIsEmpty(effectivelyEmpty);
    dispatch({ type: 'UPDATE_ONBOARDING_PILL_CONTENT', pillId, content: effectivelyEmpty ? '' : html });
  }

  function handleLinkButtonMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      const selectedText = sel.toString();
      if (selectedText) setLinkText(selectedText);
    }
    setShowLinkForm(true);
  }

  function handleInsertLink() {
    const text = linkText.trim();
    const rawUrl = linkUrl.trim();
    if (!text || !rawUrl) return;
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const linkHtml = `<a href="${url}" target="_blank" style="color:#1F9839;text-decoration:underline;">${text}</a>`;
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand('insertHTML', false, linkHtml);
    const html = editorRef.current?.innerHTML ?? '';
    dispatch({ type: 'UPDATE_ONBOARDING_PILL_CONTENT', pillId, content: html });
    setIsEmpty(!html);
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  function handleCancelLink() {
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  return (
    <div>
      {/* Micro toolbar */}
      <div className="flex items-center gap-1 mb-1">
        <button
          onMouseDown={handleLinkButtonMouseDown}
          className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Insert link"
        >
          <LinkIcon /> Insert Link
        </button>
      </div>

      {/* ContentEditable */}
      <div className="relative">
        {isEmpty && !isFocused && (
          <div className="absolute inset-0 px-2 py-1.5 text-[10px] text-gray-300 pointer-events-none">
            Type a snippet code or insert a link…
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor w-full text-xs text-gray-800 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-jobber min-h-[28px]"
          onInput={handleInput}
          onFocus={() => { isFocusedRef.current = true; setIsFocused(true); }}
          onBlur={() => { isFocusedRef.current = false; setIsFocused(false); }}
        />
      </div>

      {/* Link form */}
      {showLinkForm && (
        <div className="mt-1.5 bg-white border border-gray-200 rounded-lg p-2 shadow-sm space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-600 flex items-center gap-1"><LinkIcon /> Insert Link</p>
          <input
            type="text"
            placeholder="Display text"
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); }}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
          />
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={handleInsertLink}
              disabled={!linkText.trim() || !linkUrl.trim()}
              className="px-2 py-1 text-[10px] font-semibold bg-jobber text-jobber-dark rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Insert
            </button>
            <button
              onClick={handleCancelLink}
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OnboardingLinksTabProps {
  def: OnboardingLinksDefinition;
  dispatch: Dispatch<AdminAction>;
}

function OnboardingLinksTab({ def, dispatch }: OnboardingLinksTabProps) {
  const [addingPill, setAddingPill] = useState(false);
  const [newPillLabel, setNewPillLabel] = useState('');

  function submitPill() {
    if (!newPillLabel.trim()) return;
    dispatch({ type: 'ADD_ONBOARDING_PILL' });
    setNewPillLabel('');
    setAddingPill(false);
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs text-gray-400 mb-4">
        Configure the default header and training session pills shown in Onboarding Links blocks. Each pill inserts its bold label followed by whatever content you set here — type a snippet code or use Insert Link to add a hyperlink.
      </p>

      {/* Default header */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Default Section Header</label>
        <input
          type="text"
          value={def.header}
          onChange={e => dispatch({ type: 'UPDATE_ONBOARDING_HEADER', header: e.target.value })}
          placeholder="e.g. Book training"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jobber focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">This is the default text shown above the training links in each block. Users can override it per block on the canvas.</p>
      </div>

      {/* Pills list */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Training Session Pills</label>
        <div className="space-y-3">
          {def.pills.map((pill, index) => (
            <div key={pill.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide">Label</label>
                  <input
                    type="text"
                    value={pill.label}
                    onChange={e => dispatch({ type: 'UPDATE_ONBOARDING_PILL_LABEL', pillId: pill.id, label: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber mt-0.5"
                    placeholder="Session name"
                  />
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_ONBOARDING_PILL', pillId: pill.id })}
                  className="flex-shrink-0 text-red-300 hover:text-red-500 transition-colors mt-4"
                  title="Delete pill"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Content: snippet code or hyperlink via mini rich-text editor */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Content</label>
                <PillContentEditor
                  pillId={pill.id}
                  value={pill.content}
                  dispatch={dispatch}
                />
              </div>

              <p className="text-[10px] text-gray-400 mt-2">Pill #{index + 1}</p>
            </div>
          ))}
        </div>

        {addingPill ? (
          <div className="mt-3 flex items-center gap-1.5">
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={newPillLabel}
              onChange={e => setNewPillLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitPill(); if (e.key === 'Escape') { setNewPillLabel(''); setAddingPill(false); } }}
              placeholder="Session label…"
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-jobber"
            />
            <button onClick={submitPill} disabled={!newPillLabel.trim()} className="text-xs bg-jobber text-jobber-dark px-2 py-1 rounded disabled:opacity-40">Add</button>
            <button onClick={() => { setNewPillLabel(''); setAddingPill(false); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingPill(true)}
            className="mt-3 text-xs text-jobber hover:opacity-80 font-semibold flex items-center gap-1"
          >
            + Add training session
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AdminModal({ onClose }: Props) {
  const [tab, setTab] = useState<'plans' | 'addons' | 'payments' | 'onboarding'>('plans');
  const { plans, addons, jobberPayments, onboardingLinks, adminDispatch, isDirty, save, cancel, resetToDefaults } = useAdminData();

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
                  ? 'bg-jobber text-jobber-dark border-jobber hover:opacity-90'
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
          {(['plans', 'addons', 'payments', 'onboarding'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-jobber text-jobber-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'plans' ? 'Plans' : t === 'addons' ? 'Add-ons' : t === 'payments' ? 'Jobber Payments' : 'Onboarding Links (AM/KAM)'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'plans' && <PlansTab plans={plans} dispatch={adminDispatch} />}
          {tab === 'addons' && <AddonsTab addons={addons} dispatch={adminDispatch} />}
          {tab === 'payments' && <PaymentsTab def={jobberPayments} dispatch={adminDispatch} />}
          {tab === 'onboarding' && <OnboardingLinksTab def={onboardingLinks} dispatch={adminDispatch} />}
        </div>
      </div>
    </div>
  );
}
