import type { Dispatch } from 'react';
import type { TextBlock as TextBlockType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: TextBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function TextBlock({ block, dispatch }: Props) {
  return (
    <div className="p-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{block.displayLabel ?? 'Body Text'}</p>
      <textarea
        className="w-full text-sm text-gray-800 border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[80px]"
        placeholder="Type your message here…"
        value={block.content}
        onChange={e => dispatch({ type: 'UPDATE_TEXT', instanceId: block.instanceId, content: e.target.value })}
      />
    </div>
  );
}
