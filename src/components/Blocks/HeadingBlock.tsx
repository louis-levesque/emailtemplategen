import type { Dispatch } from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: HeadingBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function HeadingBlock({ block, dispatch }: Props) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Heading</p>
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
        }}
      />
    </div>
  );
}
