import { useState } from 'react';
import type { AppState } from '../../types';
import { generateEmailHtml, generateEmailText } from '../../utils/generateEmailHtml';
import { copyToClipboard, copyRichTextToClipboard } from '../../utils/clipboard';
import { useAdminData } from '../../contexts/AdminDataContext';
import { PreviewModal } from './PreviewModal';

interface Props {
  state: AppState;
  onOpenAdmin: () => void;
}

export function Toolbar({ state, onOpenAdmin }: Props) {
  const { plans, addons } = useAdminData();
  const [copied, setCopied] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);
  const [gmailOpened, setGmailOpened] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const hasBlocks = state.blocks.length > 0;

  async function handleOpenInGmail() {
    // Copy rich text to clipboard — user pastes into Gmail compose body
    const html = generateEmailHtml(state, plans, addons);
    const plain = generateEmailText(state, plans, addons);
    await copyRichTextToClipboard(html, plain);

    // Open Gmail inbox — user clicks Compose and pastes
    window.open('https://mail.google.com/mail/', '_blank', 'noopener,noreferrer');

    setGmailOpened(true);
    setTimeout(() => setGmailOpened(false), 3000);
  }

  function handleSavePDF() {
    const html = generateEmailHtml(state, plans, addons);
    const printStyles = `<style>
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { margin: 0; size: A4 portrait; }
      body { margin: 15mm !important; background: white !important; }
    </style>`;
    const printHtml = html.replace('</head>', `${printStyles}</head>`);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(printHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  async function handleCopy() {
    const html = generateEmailHtml(state, plans, addons);
    await copyToClipboard(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyRich() {
    const html = generateEmailHtml(state, plans, addons);
    const plain = generateEmailText(state, plans, addons);
    await copyRichTextToClipboard(html, plain);
    setCopiedRich(true);
    setTimeout(() => setCopiedRich(false), 2000);
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-jobber rounded-lg flex items-center justify-center">
            <span className="text-jobber-dark text-sm font-bold">J</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Email Template Builder</h1>
            <p className="text-xs text-gray-400">Build and copy email templates for Gmail</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {state.blocks.length} block{state.blocks.length !== 1 ? 's' : ''}
          </span>

          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all"
          >
            Admin
          </button>

          <button
            onClick={() => setPreviewing(true)}
            disabled={!hasBlocks}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              hasBlocks
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95'
                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
            }`}
          >
            Preview Email
          </button>

          <button
            onClick={handleSavePDF}
            disabled={!hasBlocks}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1.5 ${
              hasBlocks
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95'
                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
            }`}
            title="Opens a print-ready version — choose 'Save as PDF' in the print dialog"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10v2.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10"/>
              <polyline points="4.5,6.5 7,9.5 9.5,6.5"/>
              <line x1="7" y1="1" x2="7" y2="9.5"/>
            </svg>
            Save as PDF
          </button>

          <button
            onClick={handleOpenInGmail}
            disabled={!hasBlocks}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1.5 ${
              gmailOpened
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : !hasBlocks
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95'
            }`}
            title="Copies rich text to clipboard and opens Gmail compose — just paste (Ctrl+V) into the body"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill={!hasBlocks ? '#d1d5db' : '#EA4335'}/>
            </svg>
            {gmailOpened ? '✓ Copied — paste in Gmail!' : 'Copy + Open Gmail'}
          </button>

          <button
            onClick={handleCopyRich}
            disabled={!hasBlocks}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              copiedRich
                ? 'bg-jobber text-jobber-dark opacity-80'
                : !hasBlocks
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-jobber text-jobber-dark hover:opacity-90 active:scale-95'
            }`}
          >
            {copiedRich ? '✓ Copied!' : 'Copy Only'}
          </button>

          <button
            onClick={handleCopy}
            disabled={!hasBlocks}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              copied
                ? 'bg-jobber border-jobber text-jobber-dark'
                : !hasBlocks
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                : 'border-jobber text-jobber-dark bg-white hover:bg-jobber/10 active:scale-95'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy HTML'}
          </button>
        </div>
      </header>

      {previewing && (
        <PreviewModal
          html={generateEmailHtml(state, plans, addons)}
          onClose={() => setPreviewing(false)}
        />
      )}
    </>
  );
}
