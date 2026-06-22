import type { JobberPaymentsDefinition } from '../types';

export const JOBBER_PAYMENTS: JobberPaymentsDefinition = {
  description: 'Included on all plans, get paid 4x faster on average by accepting online payments directly in Jobber.',
  rates: [
    {
      id: 'rate-ca-us',
      location: 'Canada & US',
      standardRate: '2.9% + 30¢',
      tapToPayRate: '2.7% + 30¢',
    },
    {
      id: 'rate-uk',
      location: 'UK',
      standardRate: '1.4% + 20p',
    },
  ],
  features: [
    { id: 'pay-1', label: 'Credit Card Payments (Visa, MC, Amex)' },
    { id: 'pay-2', label: 'Debit Card Payments (US Only)' },
    { id: 'pay-3', label: 'Accept online payments by ACH (US Only)' },
    { id: 'pay-4', label: 'Tap to Pay with Mobile App' },
    { id: 'pay-5', label: 'Automatic Payments (Connect, Grow, Plus)' },
    { id: 'pay-6', label: 'Tip Collection' },
    { id: 'pay-7', label: 'Instant Payouts' },
    { id: 'pay-8', label: 'Jobber Capital' },
  ],
};
