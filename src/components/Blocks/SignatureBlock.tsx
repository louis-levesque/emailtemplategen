const SIGNATURE_FIELD = '{{{Sender.Email_Signature_Rich_Text__c}}}';

export function SignatureBlock() {
  return (
    <div className="p-3">
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Salesforce Signature</p>
        <p className="text-sm font-mono text-gray-600 break-all">{SIGNATURE_FIELD}</p>
        <p className="text-xs text-gray-400 mt-2 italic">Renders your rich text signature from Salesforce automatically.</p>
      </div>
    </div>
  );
}
