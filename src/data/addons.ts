import type { AddonDefinition } from '../types';

export const ADDONS: AddonDefinition[] = [
  {
    id: 'online-booking',
    name: 'Online Booking',
    description: 'Let clients book jobs directly from your website or social media.',
    price: '$39/mo',
    features: [
      { id: 'ob-1', label: 'Embeddable booking widget for your website' },
      { id: 'ob-2', label: 'Facebook & Instagram booking integration' },
      { id: 'ob-3', label: 'Google Business Profile booking' },
      { id: 'ob-4', label: 'Real-time availability based on your schedule' },
      { id: 'ob-5', label: 'Automatic booking confirmations sent to clients' },
      { id: 'ob-6', label: 'Client-selected service & time preferences' },
    ],
  },
  {
    id: 'quickbooks-sync',
    name: 'Two-Way QuickBooks Sync',
    description: 'Keep your books in sync automatically — no manual data entry.',
    price: '$29/mo',
    features: [
      { id: 'qb-1', label: 'Real-time sync of invoices, payments & clients' },
      { id: 'qb-2', label: 'Works with QuickBooks Online' },
      { id: 'qb-3', label: 'Automatic tax code mapping' },
      { id: 'qb-4', label: 'Eliminates double data entry' },
      { id: 'qb-5', label: 'Sync history & activity log' },
    ],
  },
  {
    id: 'marketing-tools',
    name: 'Jobber Marketing Tools',
    description: 'Send campaigns and win more repeat business from your existing clients.',
    price: '$50/mo',
    features: [
      { id: 'mt-1', label: 'Email marketing campaigns' },
      { id: 'mt-2', label: 'Pre-built campaign templates' },
      { id: 'mt-3', label: 'Client segmentation & targeting' },
      { id: 'mt-4', label: 'Campaign performance analytics' },
      { id: 'mt-5', label: 'Unsubscribe management (CAN-SPAM compliant)' },
    ],
  },
  {
    id: 'tip-management',
    name: 'Tip Management',
    description: 'Give clients an easy way to tip your team after every job.',
    price: '$9/mo',
    features: [
      { id: 'tm-1', label: 'Tip prompts on client-facing invoices' },
      { id: 'tm-2', label: 'Configurable tip percentage options' },
      { id: 'tm-3', label: 'Tips tracked per team member' },
      { id: 'tm-4', label: 'Tip payouts in reporting' },
    ],
  },
  {
    id: 'ai-receptionist',
    name: 'AI Receptionist',
    description: 'Never miss a lead — an AI answers calls, qualifies leads, and books jobs 24/7.',
    price: '$89/mo',
    features: [
      { id: 'ai-1', label: '24/7 AI-powered call answering' },
      { id: 'ai-2', label: 'Lead qualification & intake' },
      { id: 'ai-3', label: 'Automatic job booking from calls' },
      { id: 'ai-4', label: 'Call transcripts & summaries in Jobber' },
      { id: 'ai-5', label: 'Voicemail fallback & SMS follow-ups' },
    ],
  },
  {
    id: 'automated-quotes',
    name: 'Automated Quote Upgrades',
    description: 'Turn more quotes into jobs with smart follow-up automations.',
    price: 'Included in Connect+',
    features: [
      { id: 'aq-1', label: 'Scheduled follow-up emails & texts after quote sent' },
      { id: 'aq-2', label: 'Customizable follow-up timing & messages' },
      { id: 'aq-3', label: 'Client quote-approval tracking' },
      { id: 'aq-4', label: 'Quote win/loss reporting' },
    ],
  },
];
