import { useState } from 'react';
import type { AppState } from '../../types';
import { generateEmailHtml } from '../../utils/generateEmailHtml';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  state: AppState;
}

export function Toolbar({ state }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const html = generateEmailHtml(state);
    await copyToClipboard(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">J</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Email Template Builder</h1>
          <p className="text-xs text-gray-400">Build and copy email templates for Salesforce</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">
          {state.blocks.length} block{state.blocks.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleCopy}
          disabled={state.blocks.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : state.blocks.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy HTML to Clipboard'}
        </button>
      </div>
    </header>
  );
}
