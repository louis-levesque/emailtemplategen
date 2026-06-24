import { useState, type Dispatch } from 'react';
import type { CheckoutLinkBlock as CheckoutLinkBlockType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { isValidHttpUrl } from '../../utils/sanitize';

interface Props {
  block: CheckoutLinkBlockType;
  dispatch: Dispatch<CanvasAction>;
}

export function CheckoutLinkBlock({ block, dispatch }: Props) {
  const [draft, setDraft] = useState(block.url);
  const [editing, setEditing] = useState(!block.url);

  const draftTrimmed = draft.trim();
  const urlIsInvalid = !!draftTrimmed && !isValidHttpUrl(draftTrimmed);

  function handleSave() {
    if (!draftTrimmed || urlIsInvalid) return;
    dispatch({ type: 'SET_CHECKOUT_URL', instanceId: block.instanceId, url: draftTrimmed });
    setEditing(false);
  }

  function handleEdit() {
    setDraft(block.url);
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="p-3">
        <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Checkout Link</p>
          <p className="text-xs text-blue-400 mb-3">Paste the checkout page URL below. It will appear as a button in the email.</p>
          <input
            type="url"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="https://checkout.jobber.com/..."
            className="w-full text-sm border border-blue-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent mb-1"
            autoFocus
          />
          {urlIsInvalid && (
            <p className="text-xs text-red-500 mb-2">URL must start with https:// or http://</p>
          )}
          <button
            onClick={handleSave}
            disabled={!draftTrimmed || urlIsInvalid}
            className="px-4 py-1.5 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-1"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Checkout Link</p>
          <button
            onClick={handleEdit}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
            title="Edit URL"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L3.5 10.5l-2.5.5.5-2.5L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit URL
          </button>
        </div>
        {/* Button preview */}
        <div className="flex justify-center py-2">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-bold no-underline"
            style={{ backgroundColor: '#9DC63F', color: '#1D2D44' }}
            onClick={e => e.preventDefault()}
          >
            Preview Checkout Page
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-2 truncate text-center" title={block.url}>{block.url}</p>
      </div>
    </div>
  );
}
