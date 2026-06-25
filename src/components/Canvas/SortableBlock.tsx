import type { CSSProperties, Dispatch } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CanvasBlock, PlanDefinition, AddonDefinition } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { useAdminData } from '../../contexts/AdminDataContext';
import { PlanBlock } from '../Blocks/PlanBlock';
import { AddonBlock } from '../Blocks/AddonBlock';
import { SignatureBlock } from '../Blocks/SignatureBlock';
import { TextBlock } from '../Blocks/TextBlock';
import { HeadingBlock } from '../Blocks/HeadingBlock';
import { CheckoutLinkBlock } from '../Blocks/CheckoutLinkBlock';
import { CompareBlock } from '../Blocks/CompareBlock';
import { JobberPaymentsBlock } from '../Blocks/JobberPaymentsBlock';
import { OnboardingLinksBlock } from '../Blocks/OnboardingLinksBlock';

interface Props {
  block: CanvasBlock;
  dispatch: Dispatch<CanvasAction>;
  showInsertLine?: boolean;
}

function getBlockMeta(block: CanvasBlock, plans: PlanDefinition[], addons: AddonDefinition[]): { label: string; color: string } {
  switch (block.kind) {
    case 'plan': {
      const plan = plans.find(p => p.id === block.definitionId);
      return { label: plan?.title ?? 'Plan', color: plan?.color ?? '#9DC63F' };
    }
    case 'addon': {
      const addon = addons.find(a => a.id === block.definitionId);
      return { label: addon?.name ?? 'Add-on', color: '#9DC63F' };
    }
    case 'text':
      return { label: block.displayLabel ?? 'Free Text', color: '#6b7280' };
    case 'heading': {
      const preview = block.text ? `: "${block.text.slice(0, 28)}${block.text.length > 28 ? '…' : ''}"` : '';
      return { label: `Heading${preview}`, color: '#6b7280' };
    }
    case 'checkout':
      return { label: 'Checkout Link', color: '#6b7280' };
    case 'compare':
      return { label: 'Compare', color: '#6b7280' };
    case 'payments':
      return { label: 'Jobber Payments', color: '#0891B2' };
    case 'onboarding':
      return { label: 'Onboarding Links (AM/KAM)', color: '#1D2D44' };
    case 'signature':
      return { label: 'Signature', color: '#6b7280' };
  }
}

function BlockContent({ block, dispatch }: Props) {
  switch (block.kind) {
    case 'plan': return <PlanBlock block={block} dispatch={dispatch} />;
    case 'addon': return <AddonBlock block={block} dispatch={dispatch} />;
    case 'signature': return <SignatureBlock />;
    case 'text': return <TextBlock block={block} dispatch={dispatch} />;
    case 'heading': return <HeadingBlock block={block} dispatch={dispatch} />;
    case 'checkout': return <CheckoutLinkBlock block={block} dispatch={dispatch} />;
    case 'compare': return <CompareBlock block={block} dispatch={dispatch} />;
    case 'payments': return <JobberPaymentsBlock block={block} dispatch={dispatch} />;
    case 'onboarding': return <OnboardingLinksBlock block={block} dispatch={dispatch} />;
  }
}

const ChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,8 6,4 10,8" />
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,4 6,8 10,4" />
  </svg>
);

export function SortableBlock({ block, dispatch, showInsertLine }: Props) {
  const { plans, addons } = useAdminData();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.instanceId });
  const { label, color } = getBlockMeta(block, plans, addons);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl hover:bg-gray-50"
      title="Drag to reorder"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400">
        <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
        <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
        <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
        <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
        <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
        <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
      </svg>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {showInsertLine && (
        <div className="h-0.5 bg-jobber rounded-full mb-1 mx-1" />
      )}
      <div className="relative group bg-white rounded-xl shadow-sm border border-gray-100 mb-3 hover:border-jobber/40 hover:shadow-md transition-all">
        {dragHandle}

        {block.collapsed ? (
          /* ── Collapsed row ── */
          <div className="flex items-center h-10 pl-9 pr-2 gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="flex-1 text-sm font-medium text-gray-700 truncate">{label}</span>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_BLOCK_COLLAPSED', instanceId: block.instanceId })}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-jobber hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Expand"
            >
              <ChevronDown />
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_BLOCK', instanceId: block.instanceId })}
              className="w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors"
              title="Remove block"
            >
              ×
            </button>
          </div>
        ) : (
          /* ── Expanded content ── */
          <>
            {/* Collapse button */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_BLOCK_COLLAPSED', instanceId: block.instanceId })}
              className="absolute top-2 right-9 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-jobber hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Collapse"
            >
              <ChevronUp />
            </button>
            {/* Remove button */}
            <button
              onClick={() => dispatch({ type: 'REMOVE_BLOCK', instanceId: block.instanceId })}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold z-10"
              title="Remove block"
            >
              ×
            </button>
            <div className="pl-8">
              <BlockContent block={block} dispatch={dispatch} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
