import type { Dispatch } from 'react';
import type { JobberPaymentsBlock as JobberPaymentsBlockType } from '../../types';
import { useAdminData } from '../../contexts/AdminDataContext';
import type { CanvasAction } from '../../store/canvasReducer';
import { FeatureBuckets } from './FeatureBuckets';

const PAYMENTS_COLOR = '#0891B2';

interface Props {
  block: JobberPaymentsBlockType;
  dispatch: Dispatch<CanvasAction>;
}

function PaymentCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="1.5" />
      <line x1="1" y1="6.5" x2="15" y2="6.5" />
      <line x1="3.5" y1="10" x2="6" y2="10" />
    </svg>
  );
}

export function JobberPaymentsBlock({ block, dispatch }: Props) {
  const { jobberPayments: def } = useAdminData();

  const selectedRate = def.rates.find(r => r.id === block.selectedRateId) ?? def.rates[0];

  return (
    <div className="p-3">
      <div className="rounded-lg overflow-hidden border border-gray-200 border-l-4" style={{ borderLeftColor: PAYMENTS_COLOR }}>

        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
          <span style={{ color: PAYMENTS_COLOR }}>
            <PaymentCardIcon />
          </span>
          <span className="font-semibold text-gray-800 leading-snug">Jobber Payments</span>
        </div>

        {/* Rate selector */}
        {def.rates.length > 1 && (
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Region</p>
            <div className="flex gap-1.5 flex-wrap">
              {def.rates.map(rate => (
                <button
                  key={rate.id}
                  onClick={() => dispatch({ type: 'SET_PAYMENTS_RATE', instanceId: block.instanceId, rateId: rate.id })}
                  className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                  style={
                    selectedRate?.id === rate.id
                      ? { backgroundColor: PAYMENTS_COLOR, borderColor: PAYMENTS_COLOR, color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: PAYMENTS_COLOR + '66', color: PAYMENTS_COLOR }
                  }
                >
                  {rate.location}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rate display */}
        {selectedRate && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gray-500">{selectedRate.location}</span>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: PAYMENTS_COLOR }}>
                  {selectedRate.standardRate} <span className="text-xs font-normal text-gray-400">per transaction</span>
                </div>
                {selectedRate.tapToPayRate && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Tap to Pay: <span className="font-medium" style={{ color: PAYMENTS_COLOR }}>{selectedRate.tapToPayRate}</span> <span className="text-gray-400">per transaction</span>
                  </div>
                )}
                {selectedRate.achRate && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    ACH (US Only): <span className="font-medium" style={{ color: PAYMENTS_COLOR }}>{selectedRate.achRate}</span> <span className="text-gray-400">per transaction</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-600">
          {def.description}
          {def.learnMoreUrl && (
            <a
              href={def.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium"
              style={{ color: PAYMENTS_COLOR }}
            >
              Learn more
            </a>
          )}
        </div>

        {/* Feature buckets */}
        <div className="px-4 py-3">
          <FeatureBuckets
            allFeatures={def.features}
            visibleFeatureIds={block.visibleFeatureIds}
            keyFeatureIds={block.keyFeatureIds ?? []}
            onSetBucket={(featureId, bucket) =>
              dispatch({ type: 'SET_FEATURE_BUCKET', instanceId: block.instanceId, featureId, bucket })
            }
          />
        </div>
      </div>
    </div>
  );
}
