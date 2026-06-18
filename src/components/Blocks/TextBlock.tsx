import { useState, useRef } from 'react';
import type { Dispatch } from 'react';
import type { TextBlock as TextBlockType } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';

interface Props {
  block: TextBlockType;
  dispatch: Dispatch<CanvasAction>;
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M5 7a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24L5.88 2.38" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 5a3 3 0 0 0-4.24 0L1.26 6.5a3 3 0 0 0 4.24 4.24L6.12 9.62" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function TextBlock({ block, dispatch }: Props) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);

  function handleLinkButtonClick() {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      savedSelectionRef.current = { start, end };
      // Pre-fill display text with any selected text
      if (start !== end) {
        setLinkText(block.content.slice(start, end));
      }
    }
    setShowLinkForm(true);
  }

  function handleInsertLink() {
    const text = linkText.trim();
    const rawUrl = linkUrl.trim();
    if (!text || !rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const insertion = `[${text}](${url})`;

    const sel = savedSelectionRef.current;
    let newContent: string;
    if (sel !== null) {
      newContent =
        block.content.slice(0, sel.start) + insertion + block.content.slice(sel.end);
      // Restore cursor after React re-renders the textarea
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.selectionStart = ta.selectionEnd = sel.start + insertion.length;
        }
      }, 0);
    } else {
      newContent = block.content + insertion;
    }

    dispatch({ type: 'UPDATE_TEXT', instanceId: block.instanceId, content: newContent });
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedSelectionRef.current = null;
  }

  function handleCancel() {
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedSelectionRef.current = null;
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {block.displayLabel ?? 'Body Text'}
        </p>
        <button
          onClick={handleLinkButtonClick}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <LinkIcon />
          Insert Link
        </button>
      </div>

      <textarea
        ref={textareaRef}
        className="w-full text-sm text-gray-800 border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-jobber min-h-[80px]"
        placeholder="Type your message here…"
        value={block.content}
        onChange={e =>
          dispatch({ type: 'UPDATE_TEXT', instanceId: block.instanceId, content: e.target.value })
        }
      />

      {showLinkForm && (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Insert Link</p>
          <div>
            <label className="text-xs text-gray-400 mb-0.5 block">Display text</label>
            <input
              type="text"
              placeholder="e.g. Watch our intro video"
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-jobber"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-0.5 block">URL</label>
            <input
              type="url"
              placeholder="e.g. https://youtube.com/watch?v=..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); }}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-jobber"
            />
          </div>
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={handleInsertLink}
              disabled={!linkText.trim() || !linkUrl.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-jobber text-jobber-dark rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Insert
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
