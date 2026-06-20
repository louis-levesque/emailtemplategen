import { useReducer, useState } from 'react';
import { PLANS as DEFAULT_PLANS } from '../data/plans';
import { ADDONS as DEFAULT_ADDONS } from '../data/addons';
import type { PlanDefinition, AddonDefinition, PriceTier, AddonPriceTier, PlanPricingOption } from '../types';

const STORAGE_KEY = 'jobber-email-builder-admin-v1';

export interface AdminState {
  plans: PlanDefinition[];
  addons: AddonDefinition[];
}

export type AdminAction =
  | { type: 'UPDATE_PLAN_META'; planId: string; field: 'title' | 'tagline' | 'color'; value: string }
  | { type: 'UPDATE_TIER_SEATS'; planId: string; tierIndex: number; seats: number }
  | { type: 'UPDATE_TIER_PRICE'; planId: string; tierIndex: number; optionId: string; field: 'price' | 'monthlyEquivalent'; value: string }
  | { type: 'ADD_TIER'; planId: string }
  | { type: 'REMOVE_TIER'; planId: string; tierIndex: number }
  | { type: 'ADD_PRICING_OPTION'; planId: string }
  | { type: 'REMOVE_PRICING_OPTION'; planId: string; optionId: string }
  | { type: 'UPDATE_PRICING_OPTION'; planId: string; optionId: string; label: string }
  | { type: 'REORDER_PRICING_OPTIONS'; planId: string; fromIndex: number; toIndex: number }
  | { type: 'ADD_PLAN_FEATURE'; planId: string; label: string }
  | { type: 'UPDATE_PLAN_FEATURE'; planId: string; featureId: string; label: string }
  | { type: 'DELETE_PLAN_FEATURE'; planId: string; featureId: string }
  | { type: 'MOVE_PLAN_FEATURE'; fromPlanId: string; toPlanId: string; featureId: string }
  | { type: 'REORDER_PLAN_FEATURES'; planId: string; fromIndex: number; toIndex: number }
  | { type: 'REORDER_ADDON_FEATURES'; addonId: string; fromIndex: number; toIndex: number }
  | { type: 'ADD_PLAN' }
  | { type: 'DELETE_PLAN'; planId: string }
  | { type: 'UPDATE_ADDON_META'; addonId: string; field: 'name' | 'description'; value: string }
  | { type: 'ADD_ADDON_TIER'; addonId: string }
  | { type: 'REMOVE_ADDON_TIER'; addonId: string; tierIndex: number }
  | { type: 'UPDATE_ADDON_TIER'; addonId: string; tierIndex: number; field: 'label' | 'price' | 'monthlyEquivalent'; value: string }
  | { type: 'ADD_ADDON_FEATURE'; addonId: string; label: string }
  | { type: 'UPDATE_ADDON_FEATURE'; addonId: string; featureId: string; label: string }
  | { type: 'DELETE_ADDON_FEATURE'; addonId: string; featureId: string }
  | { type: 'ADD_ADDON' }
  | { type: 'DELETE_ADDON'; addonId: string }
  | { type: 'RESET_TO_STATE'; state: AdminState };

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'UPDATE_PLAN_META':
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : { ...p, [action.field]: action.value }
        ),
      };

    case 'UPDATE_TIER_SEATS': {
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            tiers: p.tiers.map((t, i) =>
              i !== action.tierIndex ? t : { ...t, seats: action.seats }
            ),
          }
        ),
      };
    }

    case 'UPDATE_TIER_PRICE': {
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            tiers: p.tiers.map((t, i) => {
              if (i !== action.tierIndex) return t;
              const existing = t.prices[action.optionId] ?? { price: '$0/mo' };
              return {
                ...t,
                prices: {
                  ...t.prices,
                  [action.optionId]: { ...existing, [action.field]: action.value },
                },
              };
            }),
          }
        ),
      };
    }

    case 'ADD_TIER': {
      const plan = state.plans.find(p => p.id === action.planId);
      if (!plan) return state;
      const maxSeats = Math.max(...plan.tiers.map(t => t.seats));
      const seedPrices: PriceTier['prices'] = {};
      for (const opt of plan.pricingOptions) {
        seedPrices[opt.id] = { price: '$0/mo' };
      }
      const newTier: PriceTier = {
        seats: maxSeats + 5,
        prices: seedPrices,
      };
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : { ...p, tiers: [...p.tiers, newTier] }
        ),
      };
    }

    case 'REMOVE_TIER':
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            tiers: p.tiers.filter((_, i) => i !== action.tierIndex),
          }
        ),
      };

    case 'ADD_PRICING_OPTION': {
      const newId = `${action.planId}-opt-${Date.now()}`;
      return {
        ...state,
        plans: state.plans.map(p => {
          if (p.id !== action.planId) return p;
          const newOption: PlanPricingOption = { id: newId, label: 'New pricing option' };
          return {
            ...p,
            pricingOptions: [...p.pricingOptions, newOption],
            tiers: p.tiers.map(t => ({
              ...t,
              prices: { ...t.prices, [newId]: { price: '$0/mo' } },
            })),
          };
        }),
      };
    }

    case 'REMOVE_PRICING_OPTION': {
      return {
        ...state,
        plans: state.plans.map(p => {
          if (p.id !== action.planId) return p;
          return {
            ...p,
            pricingOptions: p.pricingOptions.filter(o => o.id !== action.optionId),
            tiers: p.tiers.map(t => {
              const { [action.optionId]: _removed, ...rest } = t.prices;
              return { ...t, prices: rest };
            }),
          };
        }),
      };
    }

    case 'UPDATE_PRICING_OPTION': {
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            pricingOptions: p.pricingOptions.map(o =>
              o.id !== action.optionId ? o : { ...o, label: action.label }
            ),
          }
        ),
      };
    }

    case 'REORDER_PRICING_OPTIONS': {
      const plan = state.plans.find(p => p.id === action.planId);
      if (!plan) return state;
      const options = [...plan.pricingOptions];
      const [moved] = options.splice(action.fromIndex, 1);
      options.splice(action.toIndex, 0, moved);
      return {
        ...state,
        plans: state.plans.map(p => p.id !== action.planId ? p : { ...p, pricingOptions: options }),
      };
    }

    case 'ADD_PLAN_FEATURE': {
      const newId = `${action.planId}-f${Date.now()}`;
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            features: [...p.features, { id: newId, label: action.label }],
          }
        ),
      };
    }

    case 'UPDATE_PLAN_FEATURE':
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            features: p.features.map(f =>
              f.id !== action.featureId ? f : { ...f, label: action.label }
            ),
          }
        ),
      };

    case 'DELETE_PLAN_FEATURE':
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id !== action.planId ? p : {
            ...p,
            features: p.features.filter(f => f.id !== action.featureId),
          }
        ),
      };

    case 'MOVE_PLAN_FEATURE': {
      if (action.fromPlanId === action.toPlanId) return state;
      const fromPlan = state.plans.find(p => p.id === action.fromPlanId);
      const feature = fromPlan?.features.find(f => f.id === action.featureId);
      if (!feature) return state;
      const newId = `${action.toPlanId}-f${Date.now()}`;
      return {
        ...state,
        plans: state.plans.map(p => {
          if (p.id === action.fromPlanId) {
            return { ...p, features: p.features.filter(f => f.id !== action.featureId) };
          }
          if (p.id === action.toPlanId) {
            return { ...p, features: [...p.features, { id: newId, label: feature.label }] };
          }
          return p;
        }),
      };
    }

    case 'REORDER_PLAN_FEATURES': {
      const plan = state.plans.find(p => p.id === action.planId);
      if (!plan) return state;
      const features = [...plan.features];
      const [moved] = features.splice(action.fromIndex, 1);
      features.splice(action.toIndex, 0, moved);
      return {
        ...state,
        plans: state.plans.map(p => p.id !== action.planId ? p : { ...p, features }),
      };
    }

    case 'ADD_PLAN': {
      const newId = `custom-plan-${Date.now()}`;
      const defaultOptions: PlanPricingOption[] = [
        { id: `${newId}-opt-0`, label: 'Monthly, no commitment' },
        { id: `${newId}-opt-1`, label: 'Monthly, annual plan' },
        { id: `${newId}-opt-2`, label: 'Annual, paid upfront' },
      ];
      const seedPrices: PriceTier['prices'] = {};
      for (const opt of defaultOptions) {
        seedPrices[opt.id] = { price: '$0/mo' };
      }
      const newPlan: PlanDefinition = {
        id: newId,
        title: 'New Plan',
        tagline: 'Plan tagline here.',
        color: '#6366f1',
        pricingOptions: defaultOptions,
        tiers: [{ seats: 1, prices: seedPrices }],
        features: [],
      };
      return { ...state, plans: [...state.plans, newPlan] };
    }

    case 'DELETE_PLAN':
      return { ...state, plans: state.plans.filter(p => p.id !== action.planId) };

    case 'UPDATE_ADDON_META':
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : { ...a, [action.field]: action.value }
        ),
      };

    case 'ADD_ADDON_TIER': {
      const newTier: AddonPriceTier = {
        id: `${action.addonId}-tier-${Date.now()}`,
        label: 'New pricing option',
        price: '$0/mo',
      };
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : { ...a, tiers: [...a.tiers, newTier] }
        ),
      };
    }

    case 'REMOVE_ADDON_TIER':
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : {
            ...a,
            tiers: a.tiers.filter((_, i) => i !== action.tierIndex),
          }
        ),
      };

    case 'UPDATE_ADDON_TIER':
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : {
            ...a,
            tiers: a.tiers.map((t, i) =>
              i !== action.tierIndex ? t : { ...t, [action.field]: action.value }
            ),
          }
        ),
      };

    case 'ADD_ADDON_FEATURE': {
      const newId = `${action.addonId}-f${Date.now()}`;
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : {
            ...a,
            features: [...a.features, { id: newId, label: action.label }],
          }
        ),
      };
    }

    case 'UPDATE_ADDON_FEATURE':
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : {
            ...a,
            features: a.features.map(f =>
              f.id !== action.featureId ? f : { ...f, label: action.label }
            ),
          }
        ),
      };

    case 'DELETE_ADDON_FEATURE':
      return {
        ...state,
        addons: state.addons.map(a =>
          a.id !== action.addonId ? a : {
            ...a,
            features: a.features.filter(f => f.id !== action.featureId),
          }
        ),
      };

    case 'REORDER_ADDON_FEATURES': {
      const addon = state.addons.find(a => a.id === action.addonId);
      if (!addon) return state;
      const features = [...addon.features];
      const [moved] = features.splice(action.fromIndex, 1);
      features.splice(action.toIndex, 0, moved);
      return {
        ...state,
        addons: state.addons.map(a => a.id !== action.addonId ? a : { ...a, features }),
      };
    }

    case 'ADD_ADDON': {
      const newId = `custom-addon-${Date.now()}`;
      const newAddon: AddonDefinition = {
        id: newId,
        name: 'New Add-on',
        description: 'Describe what this add-on does.',
        tiers: [{ id: `${newId}-tier-0`, label: 'Monthly, no commitment', price: '$0/mo' }],
        features: [],
      };
      return { ...state, addons: [...state.addons, newAddon] };
    }

    case 'DELETE_ADDON':
      return { ...state, addons: state.addons.filter(a => a.id !== action.addonId) };

    // RESET_TO_STATE is used by cancel() and resetToDefaults() — returns the given
    // state reference directly so reference-equality isDirty check works correctly.
    case 'RESET_TO_STATE':
      return action.state;

    default:
      return state;
  }
}

function migrateAdminState(raw: AdminState): AdminState {
  const plans = raw.plans.map((plan: any) => {
    // Already new format — has pricingOptions array and tiers with prices record
    if (Array.isArray(plan.pricingOptions) && plan.tiers?.[0]?.prices) {
      return plan as PlanDefinition;
    }
    // Old format: tiers have fixed fields (monthlyNoCommitment, monthlyAnnual, annualMonthly, annualTotal)
    if (plan.tiers?.[0] && typeof plan.tiers[0].monthlyNoCommitment === 'string') {
      const pricingOptions: PlanPricingOption[] = [
        { id: `${plan.id}-opt-0`, label: 'Monthly, no commitment' },
        { id: `${plan.id}-opt-1`, label: 'Monthly, annual plan' },
        { id: `${plan.id}-opt-2`, label: 'Annual, paid upfront' },
      ];
      const tiers: PriceTier[] = (plan.tiers as any[]).map((t: any) => ({
        seats: t.seats,
        prices: {
          [`${plan.id}-opt-0`]: { price: t.monthlyNoCommitment ?? '$0/mo' },
          [`${plan.id}-opt-1`]: { price: t.monthlyAnnual ?? '$0/mo' },
          [`${plan.id}-opt-2`]: {
            price: t.annualTotal ?? '$0/yr',
            ...(t.annualMonthly ? { monthlyEquivalent: t.annualMonthly } : {}),
          },
        },
      }));
      const { tiers: _oldTiers, ...rest } = plan;
      return { ...rest, pricingOptions, tiers } as PlanDefinition;
    }
    return plan as PlanDefinition;
  });

  const addons = raw.addons.map((a: any) => {
    // Already new format (tiers with id+label+price)
    if (Array.isArray(a.tiers) && a.tiers.length > 0 && 'id' in a.tiers[0] && 'price' in a.tiers[0]) {
      return a;
    }
    // Previous format: tiers with label + nested pricing map
    if (Array.isArray(a.tiers)) {
      const { tiers, ...rest } = a;
      return {
        ...rest,
        tiers: tiers.map((t: any, i: number) => ({
          id: `${a.id}-tier-${i}`,
          label: t.label ?? 'Monthly, no commitment',
          price: t.pricing?.monthly ?? '$0/mo',
        })),
      };
    }
    // Older format: pricing map
    if (a.pricing) {
      const { pricing, ...rest } = a;
      return { ...rest, tiers: [{ id: `${a.id}-tier-0`, label: 'Monthly, no commitment', price: pricing.monthly ?? '$0/mo' }] };
    }
    // Oldest format: price string
    if (a.price) {
      const { price, ...rest } = a;
      return { ...rest, tiers: [{ id: `${a.id}-tier-0`, label: 'Monthly, no commitment', price }] };
    }
    return a;
  });
  return { ...raw, plans, addons };
}

function loadFromStorage(): AdminState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateAdminState(JSON.parse(raw) as AdminState);
  } catch {}
  return { plans: DEFAULT_PLANS, addons: DEFAULT_ADDONS };
}

function persistToStorage(state: AdminState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useAdminStore() {
  // savedState is what's currently on disk. workingState is the live draft.
  // isDirty uses reference equality: every reducer action returns a new object,
  // and RESET_TO_STATE returns the savedState reference itself, so the check
  // snaps back to false after save or cancel without a deep comparison.
  const [savedState, setSavedState] = useState(loadFromStorage);
  const [workingState, adminDispatch] = useReducer(adminReducer, savedState);

  const isDirty = workingState !== savedState;

  function save() {
    setSavedState(workingState);
    persistToStorage(workingState);
  }

  function cancel() {
    adminDispatch({ type: 'RESET_TO_STATE', state: savedState });
  }

  function resetToDefaults() {
    const defaults: AdminState = { plans: DEFAULT_PLANS, addons: DEFAULT_ADDONS };
    adminDispatch({ type: 'RESET_TO_STATE', state: defaults });
    setSavedState(defaults);
    persistToStorage(defaults);
  }

  return { adminState: workingState, adminDispatch, isDirty, save, cancel, resetToDefaults };
}
