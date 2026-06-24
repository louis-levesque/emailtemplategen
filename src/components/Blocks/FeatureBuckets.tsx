import { stripLinkSyntax } from '../../utils/generateEmailHtml';

interface Feature {
  id: string;
  label: string;
}

interface Props {
  allFeatures: Feature[];
  visibleFeatureIds: string[];
  keyFeatureIds: string[];
  onSetBucket: (featureId: string, bucket: 'key' | 'included' | 'hidden') => void;
  onHideAll?: () => void;
  onShowAll?: () => void;
}

function StarFilledIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1l1.6 3.3 3.6.5-2.6 2.6.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z" />
    </svg>
  );
}

function StarOutlineIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M7 1l1.6 3.3 3.6.5-2.6 2.6.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 2l10 10M5.5 5.6A2 2 0 009.4 9.4M3.2 3.8C1.8 4.8 1 6 1 7s2 4 6 4c1 0 2-.2 2.8-.5M5 2.3C5.6 2.1 6.3 2 7 2c4 0 6 3 6 5 0 .8-.4 1.7-1.1 2.5"/>
    </svg>
  );
}

function EyeOnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <ellipse cx="7" cy="7" rx="6" ry="3.5" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

export function FeatureBuckets({ allFeatures, visibleFeatureIds, keyFeatureIds, onSetBucket, onHideAll, onShowAll }: Props) {
  const keyFeatures = allFeatures.filter(f => keyFeatureIds.includes(f.id));
  const includedFeatures = allFeatures.filter(f => visibleFeatureIds.includes(f.id) && !keyFeatureIds.includes(f.id));
  const hiddenFeatures = allFeatures.filter(f => !visibleFeatureIds.includes(f.id));

  const hasVisible = keyFeatures.length > 0 || includedFeatures.length > 0;

  const allHidden = visibleFeatureIds.length === 0;

  return (
    <div className="space-y-3">
      {/* Hide All / Show All toggle — only rendered for standalone blocks, not compare slots */}
      {(onHideAll || onShowAll) && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Features</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onShowAll}
              disabled={!allHidden && visibleFeatureIds.length === allFeatures.length}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                !allHidden
                  ? 'text-jobber hover:bg-jobber/10'
                  : 'text-gray-300 cursor-default'
              }`}
            >
              Show All
            </button>
            <span className="text-gray-200 text-xs">|</span>
            <button
              onClick={onHideAll}
              disabled={allHidden}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                !allHidden
                  ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  : 'text-gray-300 cursor-default'
              }`}
            >
              Hide All
            </button>
          </div>
        </div>
      )}

      {/* Key Features */}
      <div>
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <span className="text-amber-500"><StarFilledIcon /></span>
          Key Features
        </p>
        {keyFeatures.length === 0 ? (
          <p className="text-xs text-gray-300 italic pl-0.5">
            Click ☆ on any feature below to make it a key feature
          </p>
        ) : (
          <div className="space-y-1">
            {keyFeatures.map(f => (
              <div key={f.id} className="flex items-start gap-1.5 group">
                <button
                  onClick={() => onSetBucket(f.id, 'included')}
                  title="Remove from Key Features"
                  className="mt-0.5 flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  <StarFilledIcon />
                </button>
                <span className="text-sm text-gray-800 font-medium flex-1 leading-snug">{stripLinkSyntax(f.label)}</span>
                <button
                  onClick={() => onSetBucket(f.id, 'hidden')}
                  title="Hide from email"
                  className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <EyeOffIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Features Included */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          {hasVisible && keyFeatures.length > 0 ? 'Other Features Included' : 'Features to Include'}
        </p>
        {includedFeatures.length === 0 ? (
          <p className="text-xs text-gray-300 italic pl-0.5">None — all features are either key or hidden</p>
        ) : (
          <div className="space-y-1">
            {includedFeatures.map(f => (
              <div key={f.id} className="flex items-start gap-1.5 group">
                <button
                  onClick={() => onSetBucket(f.id, 'key')}
                  title="Promote to Key Feature"
                  className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-amber-400 transition-colors"
                >
                  <StarOutlineIcon />
                </button>
                <span className="text-sm text-gray-700 flex-1 leading-snug">{stripLinkSyntax(f.label)}</span>
                <button
                  onClick={() => onSetBucket(f.id, 'hidden')}
                  title="Hide from email"
                  className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <EyeOffIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Features */}
      {hiddenFeatures.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1.5">
            Hidden — won't appear on email
          </p>
          <div className="space-y-1">
            {hiddenFeatures.map(f => (
              <div key={f.id} className="flex items-start gap-1.5 group">
                <button
                  onClick={() => onSetBucket(f.id, 'included')}
                  title="Show in email"
                  className="mt-0.5 flex-shrink-0 text-gray-200 hover:text-jobber transition-colors"
                >
                  <EyeOnIcon />
                </button>
                <span className="text-xs text-gray-300 flex-1 leading-snug italic">{stripLinkSyntax(f.label)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
