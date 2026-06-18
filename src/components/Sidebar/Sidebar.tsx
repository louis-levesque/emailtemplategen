import type { Dispatch } from 'react';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasBlock } from '../../types';
import { ALL_PRICING_KEYS } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { generateId } from '../../utils/generateId';
import { SidebarSection } from './SidebarSection';
import { DraggableSidebarItem } from './DraggableSidebarItem';

interface Props {
  dispatch: Dispatch<CanvasAction>;
}

export function Sidebar({ dispatch }: Props) {
  const { plans, addons } = useAdminData();

  function addBlock(block: CanvasBlock) {
    dispatch({ type: 'ADD_BLOCK', block });
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">Email Components</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click or drag to add to your email</p>
      </div>

      <div className="flex-1 px-2 py-3 overflow-y-auto">
        <SidebarSection title="Must Haves">
          <DraggableSidebarItem
            id="greeting"
            label="Greeting"
            description="Personalised greeting"
            blockFactory={() => ({
              instanceId: generateId(),
              kind: 'text',
              content: '',
              displayLabel: 'Greeting Text',
            })}
            onAdd={() => addBlock({
              instanceId: generateId(),
              kind: 'text',
              content: '',
              displayLabel: 'Greeting Text',
            })}
          />
          <DraggableSidebarItem
            id="checkout"
            label="Checkout Link"
            description="Paste a checkout URL — renders as a button in the email"
            blockFactory={() => ({ instanceId: generateId(), kind: 'checkout', url: '' })}
            onAdd={() => addBlock({ instanceId: generateId(), kind: 'checkout', url: '' })}
          />
        </SidebarSection>

        <SidebarSection title="Plans">
          {plans.map(plan => (
            <DraggableSidebarItem
              key={plan.id}
              id={`plan-${plan.id}`}
              label={plan.title}
              description={plan.tagline}
              price={plan.tiers[0].monthlyNoCommitment}
              color={plan.color}
              blockFactory={() => ({
                instanceId: generateId(),
                kind: 'plan',
                definitionId: plan.id,
                selectedSeats: plan.tiers[0].seats,
                visibleFeatureIds: plan.features.map(f => f.id),
                keyFeatureIds: [],
                visiblePricingKeys: [...ALL_PRICING_KEYS],
                promotions: {},
              })}
              onAdd={() => addBlock({
                instanceId: generateId(),
                kind: 'plan',
                definitionId: plan.id,
                selectedSeats: plan.tiers[0].seats,
                visibleFeatureIds: plan.features.map(f => f.id),
                keyFeatureIds: [],
                visiblePricingKeys: [...ALL_PRICING_KEYS],
                promotions: {},
              })}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Add-ons">
          {addons.map(addon => (
            <DraggableSidebarItem
              key={addon.id}
              id={`addon-${addon.id}`}
              label={addon.name}
              description={addon.description}
              price={addon.price}
              blockFactory={() => ({
                instanceId: generateId(),
                kind: 'addon',
                definitionId: addon.id,
                visibleFeatureIds: addon.features.map(f => f.id),
                keyFeatureIds: [],
                promo: null,
              })}
              onAdd={() => addBlock({
                instanceId: generateId(),
                kind: 'addon',
                definitionId: addon.id,
                visibleFeatureIds: addon.features.map(f => f.id),
                keyFeatureIds: [],
                promo: null,
              })}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Other">
          <DraggableSidebarItem
            id="free-text"
            label="Free Text"
            description="Add a custom paragraph or note"
            blockFactory={() => ({ instanceId: generateId(), kind: 'text', content: '' })}
            onAdd={() => addBlock({ instanceId: generateId(), kind: 'text', content: '' })}
          />
        </SidebarSection>
      </div>
    </aside>
  );
}
