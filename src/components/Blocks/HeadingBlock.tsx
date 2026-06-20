import type { Dispatch } from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: HeadingBlockType;
  dispatch: Dispatch<CanvasAction>;
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
      <rect x="1" y="5.5" width="8" height="1.5" rx="0.75"/>
      <rect x="1" y="9" width="12" height="1.5" rx="0.75"/>
      <rect x="1" y="12.5" width="6" height="1.5" rx="0.75"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
      <rect x="3" y="5.5" width="8" height="1.5" rx="0.75"/>
      <rect x="1" y="9" width="12" height="1.5" rx="0.75"/>
      <rect x="4" y="12.5" width="6" height="1.5" rx="0.75"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
      <rect x="5" y="5.5" width="8" height="1.5" rx="0.75"/>
      <rect x="1" y="9" width="12" height="1.5" rx="0.75"/>
      <rect x="7" y="12.5" width="6" height="1.5" rx="0.75"/>
    </svg>
  );
}

export function HeadingBlock({ block, dispatch }: Props) {
  const currentAlignment = block.alignment ?? 'center';

  const alignBtnBase = 'p-1 rounded transition-colors';
  const alignBtnActive = 'bg-gray-200 text-gray-700';
  const alignBtnInactive = 'text-gray-400 hover:bg-gray-100 hover:text-gray-600';

  function handleAlignmentClick(alignment: 'left' | 'center' | 'right') {
    dispatch({ type: 'SET_BLOCK_ALIGNMENT', instanceId: block.instanceId, alignment });
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Heading</p>
        {/* Alignment buttons */}
        <div className="flex items-center gap-0.5">
          <button
            className={`${alignBtnBase} ${currentAlignment === 'left' ? alignBtnActive : alignBtnInactive}`}
            onMouseDown={e => { e.preventDefault(); handleAlignmentClick('left'); }}
            title="Align left"
          >
            <AlignLeftIcon />
          </button>
          <button
            className={`${alignBtnBase} ${currentAlignment === 'center' ? alignBtnActive : alignBtnInactive}`}
            onMouseDown={e => { e.preventDefault(); handleAlignmentClick('center'); }}
            title="Align center"
          >
            <AlignCenterIcon />
          </button>
          <button
            className={`${alignBtnBase} ${currentAlignment === 'right' ? alignBtnActive : alignBtnInactive}`}
            onMouseDown={e => { e.preventDefault(); handleAlignmentClick('right'); }}
            title="Align right"
          >
            <AlignRightIcon />
          </button>
        </div>
      </div>
      <input
        type="text"
        value={block.text}
        onChange={e => dispatch({ type: 'UPDATE_HEADING', instanceId: block.instanceId, text: e.target.value })}
        placeholder="Enter heading text…"
        className="w-full bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-jobber transition-colors"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '22px',
          fontWeight: 800,
          color: '#1D2D44',
          lineHeight: 1.2,
          textAlign: currentAlignment,
        }}
      />
    </div>
  );
}
