import { useState, type Dispatch } from 'react';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasBlock } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { generateId } from '../../utils/generateId';
import { SidebarSection } from './SidebarSection';
import { DraggableSidebarItem } from './DraggableSidebarItem';

interface Props {
  dispatch: Dispatch<CanvasAction>;
}

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.toLowerCase();
  return fields.some(f => f?.toLowerCase().includes(q));
}

export function Sidebar({ dispatch }: Props) {
  const { plans, addons, jobberPayments, onboardingLinks } = useAdminData();
  const [query, setQuery] = useState('');
  const q = query.trim();

  function addBlock(block: CanvasBlock) {
    dispatch({ type: 'ADD_BLOCK', block });
  }

  // ── Item definitions ──────────────────────────────────────────────────────

  const customizationItems = [
    <DraggableSidebarItem
      key="checkout"
      id="checkout"
      label="Checkout Link"
      description="Paste a checkout URL — renders as a button in the email"
      blockFactory={() => ({ instanceId: generateId(), kind: 'checkout', url: '' })}
      onAdd={() => addBlock({ instanceId: generateId(), kind: 'checkout', url: '' })}
    />,
    <DraggableSidebarItem
      key="compare"
      id="compare"
      label="Compare"
      description="Side-by-side comparison of up to 3 plans or add-ons"
      blockFactory={() => ({ instanceId: generateId(), kind: 'compare', slots: [null, null, null] })}
      onAdd={() => addBlock({ instanceId: generateId(), kind: 'compare', slots: [null, null, null] })}
    />,
    <DraggableSidebarItem
      key="free-text"
      id="free-text"
      label="Free Text"
      description="Add a custom paragraph or note"
      blockFactory={() => ({ instanceId: generateId(), kind: 'text', content: '' })}
      onAdd={() => addBlock({ instanceId: generateId(), kind: 'text', content: '' })}
    />,
    <DraggableSidebarItem
      key="greeting"
      id="greeting"
      label="Greeting"
      description="Personalised greeting"
      blockFactory={() => ({ instanceId: generateId(), kind: 'text', content: '', displayLabel: 'Greeting Text' })}
      onAdd={() => addBlock({ instanceId: generateId(), kind: 'text', content: '', displayLabel: 'Greeting Text' })}
    />,
    <DraggableSidebarItem
      key="heading"
      id="heading"
      label="Heading"
      description="Large bold section header"
      blockFactory={() => ({ instanceId: generateId(), kind: 'heading', text: '', alignment: 'center' })}
      onAdd={() => addBlock({ instanceId: generateId(), kind: 'heading', text: '', alignment: 'center' })}
    />,
  ];

  const onboardingItem = (
    <DraggableSidebarItem
      key="onboarding"
      id="onboarding"
      label="Onboarding Links (AM/KAM)"
      description="Training session booking links with pill toggles"
      blockFactory={() => ({
        instanceId: generateId(),
        kind: 'onboarding',
        header: onboardingLinks.header,
        content: '',
      })}
      onAdd={() => addBlock({
        instanceId: generateId(),
        kind: 'onboarding',
        header: onboardingLinks.header,
        content: '',
      })}
    />
  );

  const planItems = plans.map(plan => (
    <DraggableSidebarItem
      key={plan.id}
      id={`plan-${plan.id}`}
      label={plan.title}
      description={plan.tagline}
      color={plan.color}
      blockFactory={() => ({
        instanceId: generateId(),
        kind: 'plan',
        definitionId: plan.id,
        selectedSeats: plan.tiers[0].seats,
        visibleFeatureIds: plan.features.map(f => f.id),
        keyFeatureIds: plan.defaultKeyFeatureIds ?? [],
        visiblePricingOptionIds: plan.pricingOptions.map(o => o.id),
        promotions: {},
      })}
      onAdd={() => addBlock({
        instanceId: generateId(),
        kind: 'plan',
        definitionId: plan.id,
        selectedSeats: plan.tiers[0].seats,
        visibleFeatureIds: plan.features.map(f => f.id),
        keyFeatureIds: plan.defaultKeyFeatureIds ?? [],
        visiblePricingOptionIds: plan.pricingOptions.map(o => o.id),
        promotions: {},
      })}
    />
  ));

  const addonItems = addons.map(addon => (
    <DraggableSidebarItem
      key={addon.id}
      id={`addon-${addon.id}`}
      label={addon.name}
      description={addon.description}
      price={addon.tiers[0]?.price}
      blockFactory={() => ({
        instanceId: generateId(),
        kind: 'addon',
        definitionId: addon.id,
        visibleTierIds: addon.tiers.map(t => t.id),
        promotions: {},
        visibleFeatureIds: addon.features.map(f => f.id),
        keyFeatureIds: [],
      })}
      onAdd={() => addBlock({
        instanceId: generateId(),
        kind: 'addon',
        definitionId: addon.id,
        visibleTierIds: addon.tiers.map(t => t.id),
        promotions: {},
        visibleFeatureIds: addon.features.map(f => f.id),
        keyFeatureIds: [],
      })}
    />
  ));

  const paymentsItem = (
    <DraggableSidebarItem
      key="jobber-payments"
      id="jobber-payments"
      label="Jobber Payments"
      description={jobberPayments.description}
      blockFactory={() => ({
        instanceId: generateId(),
        kind: 'payments',
        selectedRateId: jobberPayments.rates[0]?.id ?? '',
        visibleFeatureIds: jobberPayments.features.map(f => f.id),
        keyFeatureIds: jobberPayments.defaultKeyFeatureIds ?? [],
      })}
      onAdd={() => addBlock({
        instanceId: generateId(),
        kind: 'payments',
        selectedRateId: jobberPayments.rates[0]?.id ?? '',
        visibleFeatureIds: jobberPayments.features.map(f => f.id),
        keyFeatureIds: jobberPayments.defaultKeyFeatureIds ?? [],
      })}
    />
  );

  // ── Filtered sections ─────────────────────────────────────────────────────

  const customizationLabels = [
    { el: customizationItems[0], label: 'Checkout Link', desc: 'Paste a checkout URL — renders as a button in the email' },
    { el: customizationItems[1], label: 'Compare', desc: 'Side-by-side comparison of up to 3 plans or add-ons' },
    { el: customizationItems[2], label: 'Free Text', desc: 'Add a custom paragraph or note' },
    { el: customizationItems[3], label: 'Greeting', desc: 'Personalised greeting' },
    { el: customizationItems[4], label: 'Heading', desc: 'Large bold section header' },
  ];

  const filteredCustomization = q
    ? customizationLabels.filter(i => matches(q, i.label)).map(i => i.el)
    : customizationItems;

  const filteredPlans = q
    ? plans.filter(p => matches(q, p.title)).map(p => planItems[plans.indexOf(p)])
    : planItems;

  const filteredAddons = q
    ? addons.filter(a => matches(q, a.name)).map(a => addonItems[addons.indexOf(a)])
    : addonItems;

  const filteredPayments = !q || matches(q, 'Jobber Payments')
    ? [paymentsItem]
    : [];

  const filteredOnboarding = !q || matches(q, 'Onboarding Links', 'AM/KAM', 'training')
    ? [onboardingItem]
    : [];

  const totalResults = filteredCustomization.length + filteredPlans.length + filteredAddons.length + filteredPayments.length + filteredOnboarding.length;

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">Email Components</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click or drag to add to your email</p>
        {/* Search */}
        <div className="relative mt-2.5">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter components…"
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-gray-100 border border-transparent rounded-lg outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-jobber transition-colors placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear filter"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-2 py-3 overflow-y-auto">
        {q && totalResults === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No components match "{q}"</p>
        ) : (
          <>
            {filteredCustomization.length > 0 && (
              <SidebarSection key={`customization-${!!q}`} title="Customization Blocks">
                {filteredCustomization}
              </SidebarSection>
            )}
            {filteredPlans.length > 0 && (
              <SidebarSection key={`plans-${!!q}`} title="Plans">
                {filteredPlans}
              </SidebarSection>
            )}
            {filteredAddons.length > 0 && (
              <SidebarSection key={`addons-${!!q}`} title="Add-ons">
                {filteredAddons}
              </SidebarSection>
            )}
            {filteredPayments.length > 0 && (
              <SidebarSection key={`payments-${!!q}`} title="Jobber Payments">
                {filteredPayments}
              </SidebarSection>
            )}
            {filteredOnboarding.length > 0 && (
              <SidebarSection key={`onboarding-${!!q}`} title="Onboarding Links">
                {filteredOnboarding}
              </SidebarSection>
            )}
            {!q && (
              <SidebarSection title="Other">
                <></>
              </SidebarSection>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
