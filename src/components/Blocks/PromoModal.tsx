import { useState, useEffect, useRef } from 'react';
import type { PromoConfig } from '../../types';
import { applyPromo, formatCurrency } from '../../utils/priceUtils';

export interface PromoRow {
  key: string;
  label: string;
  originalPrice: string;
}

interface RowState {
  enabled: boolean;
  type: 'percent' | 'dollar';
  value: string;       // raw input string
  durationMonths: string;
}

interface Props {
  title: string;
  rows: PromoRow[];
  initialPromos: Partial<Record<string, PromoConfig>>;
  onSave: (promos: Partial<Record<string, PromoConfig>>) => void;
  onClose: () => void;
}

function defaultRowState(existing?: PromoConfig): RowState {
  if (existing) {
    return {
      enabled: true,
      type: existing.type,
      value: String(existing.value),
      durationMonths: String(existing.durationMonths),
    };
  }
  return { enabled: false, type: 'percent', value: '', durationMonths: '3' };
}

export function PromoModal({ title, rows, initialPromos, onSave, onClose }: Props) {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() => {
    const s: Record<string, RowState> = {};
    rows.forEach(r => { s[r.key] = defaultRowState(initialPromos[r.key]); });
    return s;
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function patch(key: string, patch: Partial<RowState>) {
    setRowStates(s => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  function handleSave() {
    const promos: Partial<Record<string, PromoConfig>> = {};
    rows.forEach(r => {
      const rs = rowStates[r.key];
      if (!rs.enabled) return;
      const val = parseFloat(rs.value);
      const dur = parseInt(rs.durationMonths, 10);
      if (!isNaN(val) && val > 0 && !isNaN(dur) && dur > 0) {
        promos[r.key] = { type: rs.type, value: val, durationMonths: dur };
      }
    });
    onSave(promos);
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-lg mx-4 overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Add Promotions</h2>
            <p className="text-xs text-gray-400 mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg font-light">×</button>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {rows.map(row => {
            const rs = rowStates[row.key];
            const origNum = parseFloat(row.originalPrice.replace(/[^0-9.]/g, ''));
            const valNum = parseFloat(rs.value);
            const discounted = rs.enabled && !isNaN(valNum) && valNum > 0
              ? applyPromo(row.originalPrice, { type: rs.type, value: valNum, durationMonths: 1 })
              : null;

            return (
              <div key={row.key} className={`px-5 py-4 transition-colors ${rs.enabled ? 'bg-white' : 'bg-gray-50'}`}>
                {/* Row header: enable toggle + label */}
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-green-600"
                    checked={rs.enabled}
                    onChange={e => patch(row.key, { enabled: e.target.checked })}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${rs.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                      {row.label}
                    </span>
                    <span className={`text-xs font-mono ${rs.enabled ? 'text-gray-500' : 'text-gray-300'}`}>
                      {row.originalPrice}
                    </span>
                  </div>
                </label>

                {/* Controls — only active when enabled */}
                {rs.enabled && (
                  <div className="ml-7 space-y-3">
                    {/* Discount value + type */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">Discount</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={rs.value}
                        onChange={e => patch(row.key, { value: e.target.value })}
                        className="w-20 text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-right"
                      />
                      {/* % / $ toggle */}
                      <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-semibold">
                        <button
                          onClick={() => patch(row.key, { type: 'percent' })}
                          className={`px-2.5 py-1.5 transition-colors ${rs.type === 'percent' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >%</button>
                        <button
                          onClick={() => patch(row.key, { type: 'dollar' })}
                          className={`px-2.5 py-1.5 transition-colors border-l border-gray-200 ${rs.type === 'dollar' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >$</button>
                      </div>
                      {/* Live preview */}
                      {discounted !== null && discounted > 0 && discounted < origNum && (
                        <span className="text-xs text-green-700 font-semibold">
                          → {formatCurrency(discounted)}{row.originalPrice.includes('/mo') ? '/mo' : '/yr'}
                        </span>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">Duration</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="3"
                        value={rs.durationMonths}
                        onChange={e => patch(row.key, { durationMonths: e.target.value })}
                        className="w-20 text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-right"
                      />
                      <span className="text-xs text-gray-500">months</span>
                      {/* Quick picks */}
                      <div className="flex gap-1">
                        {[3, 6, 12].map(m => (
                          <button
                            key={m}
                            onClick={() => patch(row.key, { durationMonths: String(m) })}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${rs.durationMonths === String(m) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                          >{m}mo</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Save Promotions
          </button>
        </div>
      </div>
    </div>
  );
}
