import type { PlanDefinition } from '../types';

export const PLANS: PlanDefinition[] = [
  {
    id: 'core',
    title: 'Core',
    tagline: 'Essential tools to grow your reputation as a professional home service business.',
    color: '#1F9839',
    pricingOptions: [
      { id: 'core-opt-2', label: '1-year commitment, billed annually' },
      { id: 'core-opt-1', label: '1-year commitment, billed monthly' },
      { id: 'core-opt-0', label: 'No commitment, billed monthly' },
    ],
    tiers: [
      {
        seats: 1,
        prices: {
          'core-opt-0': { price: '$49/mo' },
          'core-opt-1': { price: '$39/mo' },
          'core-opt-2': { price: '$348/yr', monthlyEquivalent: '$29/mo' },
        },
      },
    ],
    features: [
      { id: 'core-1', label: 'Lead and Client management (CRM)' },
      { id: 'core-2', label: 'Client hub' },
      { id: 'core-3', label: 'Requests & online booking' },
      { id: 'core-5', label: 'Scheduling & job tracking' },
      { id: 'core-6', label: 'Job details and attachments' },
      { id: 'core-9', label: 'Tip collection' },
      { id: 'core-10', label: 'Instant payouts' },
      { id: 'core-11', label: 'Progress invoicing' },
      { id: 'core-12', label: 'Jobber AI Voice & Chat' },
      { id: 'core-13', label: 'Insights dashboard' },
      { id: 'core-16', label: 'Home Depot integration' },
      { id: 'core-17', label: 'Mobile app (iOS & Android)' },
      { id: 'core-18', label: '1-on-1 product support' },
      { id: 'core-19', label: 'Jobber Capital' },
      { id: 'core-20', label: 'Marketing Performance dashboard' },
      { id: 'core-21', label: 'Book and schedule jobs online' },
      { id: 'core-22', label: 'Send professional quotes' },
      { id: 'core-23', label: 'Send invoices and receive online payments' },
      { id: 'core-24', label: 'Create a professional website' },
      { id: 'core-25', label: 'Financial, client & work Reporting' },
      { id: 'core-26', label: 'Access the app marketplace' },
    ],
    defaultKeyFeatureIds: ['core-21', 'core-22', 'core-23', 'core-24', 'core-25', 'core-26'],
  },
  {
    id: 'connect',
    title: 'Connect',
    tagline: 'Automations and must-have integrations to reduce admin work and impress customers.',
    color: '#0A6FD1',
    pricingOptions: [
      { id: 'connect-opt-2', label: '1-year commitment, billed annually' },
      { id: 'connect-opt-1', label: '1-year commitment, billed monthly' },
      { id: 'connect-opt-0', label: 'No commitment, billed monthly' },
    ],
    tiers: [
      {
        seats: 1,
        prices: {
          'connect-opt-0': { price: '$139/mo' },
          'connect-opt-1': { price: '$119/mo' },
          'connect-opt-2': { price: '$1,188/yr', monthlyEquivalent: '$99/mo' },
        },
      },
      {
        seats: 5,
        prices: {
          'connect-opt-0': { price: '$199/mo' },
          'connect-opt-1': { price: '$169/mo' },
          'connect-opt-2': { price: '$1,788/yr', monthlyEquivalent: '$149/mo' },
        },
      },
      {
        seats: 10,
        prices: {
          'connect-opt-0': { price: '$299/mo' },
          'connect-opt-1': { price: '$259/mo' },
          'connect-opt-2': { price: '$2,748/yr', monthlyEquivalent: '$229/mo' },
        },
      },
      {
        seats: 15,
        prices: {
          'connect-opt-0': { price: '$399/mo' },
          'connect-opt-1': { price: '$339/mo' },
          'connect-opt-2': { price: '$3,588/yr', monthlyEquivalent: '$299/mo' },
        },
      },
    ],
    features: [
      { id: 'connect-0', label: 'Everything in [Core](https://help.getjobber.com/hc/en-us/articles/360048155913-The-Core-Plan)' },
      { id: 'connect-1', label: 'Automated client notifications' },
      { id: 'connect-2', label: 'Checklists' },
      { id: 'connect-3', label: 'Routing' },
      { id: 'connect-4', label: 'GPS tracking' },
      { id: 'connect-5', label: 'Time tracking and expense tracking' },
      { id: 'connect-6', label: 'High-value quote alerts' },
      { id: 'connect-7', label: 'Auto-drafted quotes' },
      { id: 'connect-8', label: 'Automated quote & invoice follow-ups' },
      { id: 'connect-9', label: 'Automatic payments' },
      { id: 'connect-11', label: 'Expense reporting' },
      { id: 'connect-12', label: 'Salesperson reporting' },
      { id: 'connect-13', label: 'Team Productivity reporting' },
      { id: 'connect-14', label: 'Custom fields' },
      { id: 'connect-15', label: 'QuickBooks Online and Xero sync' },
      { id: 'connect-16', label: 'Zapier integration' },
      { id: 'connect-17', label: 'Gusto integration' },
      { id: 'connect-18', label: 'Send automated reminders' },
      { id: 'connect-19', label: 'Collect payments automatically' },
      { id: 'connect-20', label: 'Document work with checklists' },
      { id: 'connect-21', label: 'Automate quote and invoice follow-ups' },
      { id: 'connect-22', label: 'Connect QuickBooks Online' },
      { id: 'connect-23', label: 'Track time and expenses' },
    ],
    defaultKeyFeatureIds: ['connect-18', 'connect-19', 'connect-20', 'connect-21', 'connect-22', 'connect-23'],
  },
  {
    id: 'grow',
    title: 'Grow',
    tagline: 'Advanced tools to win bigger jobs, scale your operations, and take back your admin time.',
    color: '#7C3AED',
    pricingOptions: [
      { id: 'grow-opt-2', label: '1-year commitment, billed annually' },
      { id: 'grow-opt-1', label: '1-year commitment, billed monthly' },
      { id: 'grow-opt-0', label: 'No commitment, billed monthly' },
    ],
    tiers: [
      {
        seats: 1,
        prices: {
          'grow-opt-0': { price: '$199/mo' },
          'grow-opt-1': { price: '$169/mo' },
          'grow-opt-2': { price: '$1,788/yr', monthlyEquivalent: '$149/mo' },
        },
      },
      {
        seats: 5,
        prices: {
          'grow-opt-0': { price: '$299/mo' },
          'grow-opt-1': { price: '$259/mo' },
          'grow-opt-2': { price: '$2,748/yr', monthlyEquivalent: '$229/mo' },
        },
      },
      {
        seats: 10,
        prices: {
          'grow-opt-0': { price: '$399/mo' },
          'grow-opt-1': { price: '$349/mo' },
          'grow-opt-2': { price: '$3,588/yr', monthlyEquivalent: '$299/mo' },
        },
      },
      {
        seats: 15,
        prices: {
          'grow-opt-0': { price: '$499/mo' },
          'grow-opt-1': { price: '$429/mo' },
          'grow-opt-2': { price: '$4,788/yr', monthlyEquivalent: '$399/mo' },
        },
      },
    ],
    features: [
      { id: 'grow-0', label: 'Everything in Connect' },
      { id: 'grow-4', label: 'Find a Time scheduling' },
      { id: 'grow-7', label: 'Markups on quotes' },
      { id: 'grow-8', label: 'Images and attachments on invoices' },
      { id: 'grow-9', label: 'Access advanced quote customizations' },
      { id: 'grow-10', label: 'Add optional line items' },
      { id: 'grow-11', label: 'Track time automatically' },
      { id: 'grow-12', label: 'Track costs with job costing' },
      { id: 'grow-13', label: 'Connect with customers through two-way SMS' },
      { id: 'grow-14', label: 'Build custom workflow automations' },
    ],
    defaultKeyFeatureIds: ['grow-9', 'grow-10', 'grow-11', 'grow-12', 'grow-13', 'grow-14'],
  },
  {
    id: 'plus',
    title: 'Plus',
    tagline: 'All features backed by premium support to maximize efficiency and profits.',
    color: '#D97706',
    pricingOptions: [
      { id: 'plus-opt-2', label: '1-year commitment, billed annually' },
      { id: 'plus-opt-1', label: '1-year commitment, billed monthly' },
      { id: 'plus-opt-0', label: 'No commitment, billed monthly' },
    ],
    tiers: [
      {
        seats: 5,
        prices: {
          'plus-opt-0': { price: '$499/mo' },
          'plus-opt-1': { price: '$439/mo' },
          'plus-opt-2': { price: '$4,788/yr', monthlyEquivalent: '$399/mo' },
        },
      },
      {
        seats: 10,
        prices: {
          'plus-opt-0': { price: '$599/mo' },
          'plus-opt-1': { price: '$499/mo' },
          'plus-opt-2': { price: '$5,388/yr', monthlyEquivalent: '$449/mo' },
        },
      },
      {
        seats: 15,
        prices: {
          'plus-opt-0': { price: '$699/mo' },
          'plus-opt-1': { price: '$599/mo' },
          'plus-opt-2': { price: '$6,348/yr', monthlyEquivalent: '$529/mo' },
        },
      },
      {
        seats: 'unlimited',
        prices: {
          'plus-opt-0': { price: '$1,499/mo' },
          'plus-opt-1': { price: '$1,199/mo' },
          'plus-opt-2': { price: '$11,988/yr', monthlyEquivalent: '$999/mo' },
        },
      },
    ],
    features: [
      { id: 'plus-0', label: 'Everything in Grow' },
      { id: 'plus-1', label: 'Receptionist (included — $99/mo value)' },
      { id: 'plus-2', label: 'Pipeline (included — $49/mo value)' },
      { id: 'plus-3', label: 'Marketing Suite (included — $79/mo value)' },
      { id: 'plus-4', label: 'White glove onboarding' },
      { id: 'plus-5', label: 'Premium Support (included — $99 value)' },
      { id: 'plus-6', label: 'API Tour with API Access' },
      { id: 'plus-7', label: 'Data Import (included — $499 value)' },
    ],
  },
];
