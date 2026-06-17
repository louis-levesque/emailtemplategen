import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
      >
        {title}
        <span className={`transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
