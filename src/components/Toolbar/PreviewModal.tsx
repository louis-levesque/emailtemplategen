import { useEffect, useRef } from 'react';

interface Props {
  html: string;
  onClose: () => void;
}

export function PreviewModal({ html, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on backdrop click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl mx-4 overflow-hidden"
           style={{ maxHeight: '90vh' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-500">
              <path d="M1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Z" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 5.5 8 10l7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <h2 className="text-sm font-bold text-gray-800">Email Preview</h2>
            <span className="text-xs text-gray-400 ml-1">— as it will appear to the recipient</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg font-light"
            title="Close preview (Esc)"
          >
            ×
          </button>
        </div>

        {/* Email iframe */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-sm mx-auto overflow-hidden" style={{ maxWidth: 600 }}>
            <iframe
              srcDoc={html}
              title="Email preview"
              className="w-full border-0 block"
              style={{ minHeight: 400 }}
              onLoad={e => {
                // Auto-size iframe to its content height
                const iframe = e.currentTarget;
                try {
                  const doc = iframe.contentDocument;
                  if (doc) {
                    iframe.style.height = doc.body.scrollHeight + 'px';
                  }
                } catch {
                  // cross-origin guard — won't happen since srcDoc is same-origin
                }
              }}
            />
          </div>
        </div>

        {/* Footer note */}
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Salesforce merge fields (e.g. <code className="font-mono bg-gray-200 px-1 rounded">&#123;&#123;Recipient.FirstName&#125;&#125;</code>) will resolve when sent — they appear as-is in this preview.
          </p>
        </div>
      </div>
    </div>
  );
}
