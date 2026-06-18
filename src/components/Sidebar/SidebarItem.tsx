interface Props {
  label: string;
  description?: string;
  price?: string;
  color?: string;
  onAdd: () => void;
}

export function SidebarItem({ label, description, price, color, onAdd }: Props) {
  return (
    <button
      onClick={onAdd}
      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-jobber/10 hover:border-jobber/30 border border-transparent transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {color && <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />}
            <span className="text-sm font-semibold text-gray-800 group-hover:text-jobber-dark">{label}</span>
          </div>
          {description && <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-2">{description}</p>}
        </div>
        <div className="flex flex-col items-end shrink-0">
          {price && <span className="text-xs font-bold text-jobber-dark whitespace-nowrap">{price}</span>}
          <span className="text-xs text-gray-300 group-hover:text-jobber mt-0.5">+ Add</span>
        </div>
      </div>
    </button>
  );
}
