import type { Dispatch } from 'react';
import type { EmailHeader as EmailHeaderType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  header: EmailHeaderType;
  dispatch: Dispatch<CanvasAction>;
}

export function EmailHeader({ header, dispatch }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400"/>
        <div className="w-3 h-3 rounded-full bg-yellow-400"/>
        <div className="w-3 h-3 rounded-full bg-green-400"/>
        <span className="ml-2 text-xs text-gray-400">New Email</span>
      </div>
      <div className="divide-y divide-gray-100">
        <div className="flex items-center px-4 py-2">
          <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">To:</span>
          <input
            className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
            placeholder="recipient@example.com"
            value={header.to}
            onChange={e => dispatch({ type: 'SET_HEADER', field: 'to', value: e.target.value })}
          />
        </div>
        <div className="flex items-center px-4 py-2">
          <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">Subject:</span>
          <input
            className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
            placeholder="Email subject…"
            value={header.subject}
            onChange={e => dispatch({ type: 'SET_HEADER', field: 'subject', value: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
