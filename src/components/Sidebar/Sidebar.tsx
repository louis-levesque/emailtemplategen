import type { Dispatch } from 'react';
import { PLANS } from '../../data/plans';
import { ADDONS } from '../../data/addons';
import type { CanvasBlock } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { generateId } from '../../utils/generateId';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';

interface Props {
  dispatch: Dispatch<CanvasAction>;
}

export function Sidebar({ dispatch }: Props) {
  function addBlock(block: CanvasBlock) {
    dispatch({ type: 'ADD_BLOCK', block });
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">Email Components</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click to add to your email</p>
      </div>

      <div className="flex-1 px-2 py-3 overflow-y-auto">
        <SidebarSection title="Greeting">
          <SidebarItem
            label="Greeting"
            description="Personalised greeting using Salesforce recipient name"
            onAdd={() => addBlock({
              instanceId: generateId(),
              kind: 'text',
              content: '{{#if Recipient.FirstName}}Hey {{Recipient.FirstName}},{{else}}Hey there!{{/if}}',
              displayLabel: 'Greeting Text',
            })}
          />
        </SidebarSection>

        <SidebarSection title="Plans">
          {PLANS.map(plan => (
            <SidebarItem
              key={plan.id}
              label={plan.title}
              description={plan.tagline}
              price={plan.tiers[0].monthlyNoCommitment}
              color={plan.color}
              onAdd={() => addBlock({
                instanceId: generateId(),
                kind: 'plan',
                definitionId: plan.id,
                selectedSeats: plan.tiers[0].seats,
                visibleFeatureIds: plan.features.map(f => f.id),
              })}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Add-ons">
          {ADDONS.map(addon => (
            <SidebarItem
              key={addon.id}
              label={addon.name}
              description={addon.description}
              price={addon.price}
              onAdd={() => addBlock({
                instanceId: generateId(),
                kind: 'addon',
                definitionId: addon.id,
                visibleFeatureIds: addon.features.map(f => f.id),
              })}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Other">
          <SidebarItem
            label="My Signature"
            description="Salesforce merge fields: name, title, phone, email"
            onAdd={() => addBlock({ instanceId: generateId(), kind: 'signature' })}
          />
          <SidebarItem
            label="Free Text"
            description="Add a custom paragraph or note"
            onAdd={() => addBlock({ instanceId: generateId(), kind: 'text', content: '' })}
          />
          <SidebarItem
            label="Checkout Link"
            description="Paste a checkout URL — renders as a button in the email"
            onAdd={() => addBlock({ instanceId: generateId(), kind: 'checkout', url: '' })}
          />
        </SidebarSection>
      </div>
    </aside>
  );
}
