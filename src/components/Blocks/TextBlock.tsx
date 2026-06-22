import { useState, useRef, useEffect } from 'react';
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

export function TextBlock({ block, dispatch }: Props) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!block.content);

  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);

  // Mount: set initial HTML content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = block.content;
      setIsEmpty(!block.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes when not focused
  useEffect(() => {
    if (!isFocusedRef.current && editorRef.current && block.content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = block.content;
      setIsEmpty(!block.content);
    }
  }, [block.content]);

  const currentAlignment = block.alignment ?? 'left';

  function handleInput() {
    const raw = editorRef.current?.innerHTML ?? '';
    // Normalize &nbsp; entities and Unicode non-breaking spaces inserted by
    // the browser's contentEditable into regular spaces, so they don't get
    // double-encoded by escapeHtml() into literal "&amp;nbsp;" in email output.
    const html = raw.replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
    const effectivelyEmpty = html === '' || html === '<br>';
    setIsEmpty(effectivelyEmpty);
    dispatch({
      type: 'UPDATE_TEXT',
      instanceId: block.instanceId,
      content: effectivelyEmpty ? '' : html,
    });
  }

  function handleFocus() {
    isFocusedRef.current = true;
    setIsFocused(true);
  }

  function handleBlur() {
    isFocusedRef.current = false;
    setIsFocused(false);
  }

  function handleLinkButtonClick() {
    // Save current selection
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      const selectedText = sel.toString();
      if (selectedText) {
        setLinkText(selectedText);
      }
    }
    setShowLinkForm(true);
  }

  function handleInsertLink() {
    const text = linkText.trim();
    const rawUrl = linkUrl.trim();
    if (!text || !rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const linkHtml = `<a href="${url}" target="_blank" style="color:#1F9839;text-decoration:underline;">${text}</a>`;

    // Restore saved range and insert
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      document.execCommand('insertHTML', false, linkHtml);
    }

    // Sync state
    const html = editorRef.current?.innerHTML ?? '';
    dispatch({ type: 'UPDATE_TEXT', instanceId: block.instanceId, content: html });
    setIsEmpty(!html);

    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  function handleCancel() {
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  function handleAlignmentClick(alignment: 'left' | 'center' | 'right') {
    dispatch({ type: 'SET_BLOCK_ALIGNMENT', instanceId: block.instanceId, alignment });
  }

  const alignBtnBase = 'p-1 rounded transition-colors';
  const alignBtnActive = 'bg-gray-200 text-gray-700';
  const alignBtnInactive = 'text-gray-400 hover:bg-gray-100 hover:text-gray-600';

  const fmtBtnBase = 'px-2 py-1 text-xs font-semibold rounded transition-colors border';
  const fmtBtnStyle = 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300';

  return (
    <div className="p-3">
      {/* Header row: label + link button */}
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

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mb-2">
        {/* B / I / U */}
        <button
          className={`${fmtBtnBase} ${fmtBtnStyle}`}
          onMouseDown={e => { e.preventDefault(); document.execCommand('bold'); }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={`${fmtBtnBase} ${fmtBtnStyle}`}
          onMouseDown={e => { e.preventDefault(); document.execCommand('italic'); }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={`${fmtBtnBase} ${fmtBtnStyle}`}
          onMouseDown={e => { e.preventDefault(); document.execCommand('underline'); }}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        {/* Divider */}
        <span className="w-px h-4 bg-gray-200 mx-1" />

        {/* Alignment buttons */}
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

      {/* ContentEditable editor */}
      <div className="relative">
        {isEmpty && !isFocused && (
          <div className="absolute inset-0 p-2 text-sm text-gray-300 pointer-events-none">
            Type your message here…
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full text-sm text-gray-800 border border-gray-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-jobber min-h-[80px]"
          style={{ textAlign: currentAlignment }}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

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
