import { useState, useRef, useEffect, type Dispatch } from 'react';
import type { OnboardingLinksBlock as OnboardingLinksBlockType } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';

const ONBOARDING_COLOR = '#1D2D44';

interface Props {
  block: OnboardingLinksBlockType;
  dispatch: Dispatch<CanvasAction>;
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
      <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
      <line x1="5" y1="1" x2="5" y2="4" />
      <line x1="11" y1="1" x2="11" y2="4" />
      <circle cx="5.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
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

export function OnboardingLinksBlock({ block, dispatch }: Props) {
  const { onboardingLinks: def } = useAdminData();

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
    const html = raw.replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
    const effectivelyEmpty = html === '' || html === '<br>';
    setIsEmpty(effectivelyEmpty);
    dispatch({ type: 'SET_ONBOARDING_CONTENT', instanceId: block.instanceId, content: effectivelyEmpty ? '' : html });
  }

  function handleFocus() {
    isFocusedRef.current = true;
    setIsFocused(true);
  }

  function handleBlur() {
    isFocusedRef.current = false;
    setIsFocused(false);
  }

  /** Save the current editor selection so it can be restored after a button click. */
  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      const selectedText = sel.toString();
      if (selectedText) setLinkText(selectedText);
    }
  }

  function restoreSelectionAndFocus() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }

  function syncContent() {
    const html = editorRef.current?.innerHTML ?? '';
    dispatch({ type: 'SET_ONBOARDING_CONTENT', instanceId: block.instanceId, content: html });
    setIsEmpty(!html);
  }

  // ── Pill insertion ────────────────────────────────────────────────────────────

  function handlePillMouseDown(e: React.MouseEvent, pill: (typeof def.pills)[number]) {
    // Prevent the button click from stealing focus away from the editor
    e.preventDefault();
    editorRef.current?.focus();

    // Insert bold label on its own line, followed by the pill's content
    const boldLabel = `<strong>${pill.label}</strong>`;
    const content = pill.content ?? '';
    const html = content ? `${boldLabel}<br>${content}` : boldLabel;
    document.execCommand('insertHTML', false, html);

    syncContent();
  }

  // ── Link form ─────────────────────────────────────────────────────────────────

  function handleLinkButtonClick() {
    saveSelection();
    setShowLinkForm(true);
  }

  function handleInsertLink() {
    const text = linkText.trim();
    const rawUrl = linkUrl.trim();
    if (!text || !rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const linkHtml = `<a href="${url}" target="_blank" style="color:#1F9839;text-decoration:underline;">${text}</a>`;

    restoreSelectionAndFocus();
    document.execCommand('insertHTML', false, linkHtml);
    syncContent();

    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  function handleCancelLink() {
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);
    savedRangeRef.current = null;
  }

  // ── Styles ────────────────────────────────────────────────────────────────────

  const alignBtnBase = 'p-1 rounded transition-colors';
  const alignBtnActive = 'bg-gray-200 text-gray-700';
  const alignBtnInactive = 'text-gray-400 hover:bg-gray-100 hover:text-gray-600';
  const fmtBtnBase = 'px-2 py-1 text-xs font-semibold rounded transition-colors border';
  const fmtBtnStyle = 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300';

  return (
    <div className="p-3">
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: ONBOARDING_COLOR }}>

        {/* Block label */}
        <div className="px-4 py-3 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
          <span style={{ color: ONBOARDING_COLOR }}>
            <CalendarIcon />
          </span>
          <span className="font-semibold text-gray-800 leading-snug">Onboarding Links (AM/KAM)</span>
        </div>

        {/* Editable section header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Section Header</p>
          <input
            type="text"
            value={block.header}
            onChange={e => dispatch({ type: 'SET_ONBOARDING_HEADER', instanceId: block.instanceId, header: e.target.value })}
            placeholder="e.g. Book training"
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-jobber focus:border-transparent"
          />
        </div>

        {/* Pill insert buttons */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Insert training session
            <span className="normal-case font-normal text-gray-300 ml-1">— click to insert at cursor</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {def.pills.map(pill => (
              <button
                key={pill.id}
                onMouseDown={e => handlePillMouseDown(e, pill)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors hover:opacity-80"
                style={{ backgroundColor: '#fff', borderColor: ONBOARDING_COLOR + '88', color: ONBOARDING_COLOR }}
                title={`Insert: ${pill.label}`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rich-text editor — same as Free Text block */}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Content</p>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 mb-2">
            <button className={`${fmtBtnBase} ${fmtBtnStyle}`} onMouseDown={e => { e.preventDefault(); document.execCommand('bold'); }} title="Bold">
              <strong>B</strong>
            </button>
            <button className={`${fmtBtnBase} ${fmtBtnStyle}`} onMouseDown={e => { e.preventDefault(); document.execCommand('italic'); }} title="Italic">
              <em>I</em>
            </button>
            <button className={`${fmtBtnBase} ${fmtBtnStyle}`} onMouseDown={e => { e.preventDefault(); document.execCommand('underline'); }} title="Underline">
              <span style={{ textDecoration: 'underline' }}>U</span>
            </button>

            <span className="w-px h-4 bg-gray-200 mx-1" />

            <button
              className={`${alignBtnBase} ${currentAlignment === 'left' ? alignBtnActive : alignBtnInactive}`}
              onMouseDown={e => { e.preventDefault(); dispatch({ type: 'SET_ONBOARDING_ALIGNMENT', instanceId: block.instanceId, alignment: 'left' }); }}
              title="Align left"
            >
              <AlignLeftIcon />
            </button>
            <button
              className={`${alignBtnBase} ${currentAlignment === 'center' ? alignBtnActive : alignBtnInactive}`}
              onMouseDown={e => { e.preventDefault(); dispatch({ type: 'SET_ONBOARDING_ALIGNMENT', instanceId: block.instanceId, alignment: 'center' }); }}
              title="Align center"
            >
              <AlignCenterIcon />
            </button>
            <button
              className={`${alignBtnBase} ${currentAlignment === 'right' ? alignBtnActive : alignBtnInactive}`}
              onMouseDown={e => { e.preventDefault(); dispatch({ type: 'SET_ONBOARDING_ALIGNMENT', instanceId: block.instanceId, alignment: 'right' }); }}
              title="Align right"
            >
              <AlignRightIcon />
            </button>

            <span className="w-px h-4 bg-gray-200 mx-1" />

            <button
              onClick={handleLinkButtonClick}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title="Insert link"
            >
              <LinkIcon />
              Insert Link
            </button>
          </div>

          {/* ContentEditable editor */}
          <div className="relative">
            {isEmpty && !isFocused && (
              <div className="absolute inset-0 p-2 text-sm text-gray-300 pointer-events-none">
                Click a training session above to insert its snippet, or type here…
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="rich-editor w-full text-sm text-gray-800 border border-gray-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-jobber min-h-[80px]"
              style={{ textAlign: currentAlignment }}
              onInput={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Link insertion form */}
          {showLinkForm && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Insert Link</p>
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">Display text</label>
                <input
                  type="text"
                  placeholder="e.g. Book your session"
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
                  placeholder="https://..."
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
                  onClick={handleCancelLink}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
