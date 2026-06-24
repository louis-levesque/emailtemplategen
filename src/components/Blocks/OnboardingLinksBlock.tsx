import { useRef, type Dispatch } from 'react';
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

export function OnboardingLinksBlock({ block, dispatch }: Props) {
  const { onboardingLinks: def } = useAdminData();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Insert `text` at the current cursor position in the textarea. */
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const current = block.content;

    if (!el) {
      // Fallback: append to end
      const newContent = current ? current + '\n' + text : text;
      dispatch({ type: 'SET_ONBOARDING_CONTENT', instanceId: block.instanceId, content: newContent });
      return;
    }

    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;

    // Add a newline before the insertion if there's existing content and the
    // cursor isn't already at the start of a line.
    const before = current.slice(0, start);
    const after = current.slice(end);
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + text;

    const newContent = before + insertion + after;
    dispatch({ type: 'SET_ONBOARDING_CONTENT', instanceId: block.instanceId, content: newContent });

    // Restore focus and move cursor to after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      const newPos = start + insertion.length;
      el.setSelectionRange(newPos, newPos);
    });
  }

  function handlePillClick(pill: (typeof def.pills)[number]) {
    if (pill.linkUrl) {
      // Insert as Markdown link so it renders as a hyperlink in the email
      insertAtCursor(`[${pill.label}](${pill.linkUrl})`);
    } else if (pill.insertText) {
      // Insert the TextExpander snippet code — rep expands it in place
      insertAtCursor(pill.insertText);
    }
  }

  return (
    <div className="p-3">
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: ONBOARDING_COLOR }}>

        {/* Block label */}
        <div className="px-4 py-3 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
          <span style={{ color: ONBOARDING_COLOR }}>
            <CalendarIcon />
          </span>
          <span className="font-semibold text-gray-800 leading-snug">Onboarding Links</span>
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
                onClick={() => handlePillClick(pill)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                style={{ backgroundColor: '#fff', borderColor: ONBOARDING_COLOR + '88', color: ONBOARDING_COLOR }}
                title={
                  pill.linkUrl
                    ? `Insert link: ${pill.linkUrl}`
                    : `Insert snippet: ${pill.insertText}`
                }
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free-text content area */}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Content
            <span className="normal-case font-normal text-gray-300 ml-1">— TextExpander will expand snippets here</span>
          </p>
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={e => dispatch({ type: 'SET_ONBOARDING_CONTENT', instanceId: block.instanceId, content: e.target.value })}
            placeholder="Click a training session above to insert its snippet, or type directly here…"
            rows={5}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jobber focus:border-transparent resize-y font-mono leading-relaxed placeholder-gray-300"
          />
          <p className="text-[10px] text-gray-300 mt-1">
            Tip: use <code className="bg-gray-100 px-1 rounded">{"[link text](https://...)"}</code> syntax to insert a hyperlink
          </p>
        </div>
      </div>
    </div>
  );
}
