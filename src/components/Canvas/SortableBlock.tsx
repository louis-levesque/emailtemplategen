import type { CSSProperties, Dispatch } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CanvasBlock } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { PlanBlock } from '../Blocks/PlanBlock';
import { AddonBlock } from '../Blocks/AddonBlock';
import { SignatureBlock } from '../Blocks/SignatureBlock';
import { TextBlock } from '../Blocks/TextBlock';
import { CheckoutLinkBlock } from '../Blocks/CheckoutLinkBlock';
import { CompareBlock } from '../Blocks/CompareBlock';

interface Props {
  block: CanvasBlock;
  dispatch: Dispatch<CanvasAction>;
  showInsertLine?: boolean;
}

function BlockContent({ block, dispatch }: Props) {
  switch (block.kind) {
    case 'plan': return <PlanBlock block={block} dispatch={dispatch} />;
    case 'addon': return <AddonBlock block={block} dispatch={dispatch} />;
    case 'signature': return <SignatureBlock />;
    case 'text': return <TextBlock block={block} dispatch={dispatch} />;
    case 'checkout': return <CheckoutLinkBlock block={block} dispatch={dispatch} />;
    case 'compare': return <CompareBlock block={block} dispatch={dispatch} />;
  }
}

export function SortableBlock({ block, dispatch, showInsertLine }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.instanceId });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {showInsertLine && (
        <div className="h-0.5 bg-jobber rounded-full mb-1 mx-1" />
      )}
      <div className="relative group bg-white rounded-xl shadow-sm border border-gray-100 mb-3 hover:border-jobber/40 hover:shadow-md transition-all">
        {/* Drag handle */}
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
      </div>
    </div>
  );
}
