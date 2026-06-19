import type { AddonDefinition } from '../types';

export const ADDONS: AddonDefinition[] = [
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Provide 24/7 customer service over call or text. When you\'re busy on a job, enjoying personal time, or your admin is focused on other work, your Receptionist is there. Includes 30 conversations/mo — additional conversations charged at $0.79/conversation.',
    price: '$29/mo',
    features: [
      { id: 'rec-1', label: 'Take time away from your phone without the risk of losing a lead to a competitor or damaging customer relationships.' },
      { id: 'rec-2', label: 'Responds to customer calls and texts 24/7 — can create work requests, book jobs, or answer questions. You control what it can and can\'t do.' },
      { id: 'rec-3', label: 'Monitor Receptionist in real-time — track every call and text from your Receptionist dashboard in Jobber.' },
    ],
  },
  {
    id: 'marketing-suite',
    name: 'Marketing Suite',
    description: 'All-in-one marketing toolkit to grow your business, build your brand, and win more work.',
    price: '$79/mo',
    features: [
      { id: 'ms-1', label: 'Social Posting: Create and publish posts to your Facebook page and Google Business Profile directly from Jobber.' },
      { id: 'ms-2', label: 'Job Showcase: Turn completed jobs into ready-to-publish marketing content.' },
      { id: 'ms-3', label: 'Marketing Plan: Organize all your marketing activities on a single calendar built from your Jobber data.' },
      { id: 'ms-4', label: 'Reviews: Attract new leads by building your online reputation with automated Google review asks.' },
      { id: 'ms-5', label: 'Campaigns: Create professional-looking emails with customizable templates and client segments.' },
      { id: 'ms-6', label: 'Referrals: Set up and track your referral program where clients earn credit for referring friends.' },
    ],
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    description: 'A tool that keeps all your opportunities organized so you can turn more of them into booked jobs — without all the busywork.',
    price: '$49/mo',
    features: [
      { id: 'sp-1', label: 'Your sales process, visualized: In one glance see your entire pipeline so no opportunity ever falls between the cracks.' },
      { id: 'sp-2', label: 'Keep opportunities moving forward: Jobber automatically refreshes your pipeline as opportunities progress and flags when they\'re at risk of going cold.' },
    ],
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Increase Google business reviews via an automated text to your preferred clients after work is done, with a direct link to leave a review.',
    price: '$39/mo',
    features: [
      { id: 'rev-1', label: 'Boost your online presence: Improve your reputation by automating Google review asks to your preferred customers.' },
      { id: 'rev-2', label: 'Attract more customers: Increase your visibility in local Google search results with more consistent reviews.' },
      { id: 'rev-3', label: 'Track your reputation: View your Google rating and latest reviews from your dashboard in Jobber.' },
    ],
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    description: 'Stay top of mind by sending email campaigns to your clients in Jobber. 80% of campaigns sent with Jobber Campaigns lead to at least one new job!',
    price: '$29/mo',
    features: [
      { id: 'cam-1', label: 'Create campaigns in no time: Quickly create branded emails using editable templates.' },
      { id: 'cam-2', label: 'Target the right clients: Use your Jobber data to target specific client segments.' },
      { id: 'cam-3', label: 'Analyze your results: Learn which campaigns drive the most engagement and revenue.' },
      { id: 'cam-4', label: 'No campaign limits: Send as many email campaigns as needed.' },
    ],
  },
  {
    id: 'referrals',
    name: 'Referrals',
    description: 'Get even more referrals with automated incentives that help you win more jobs and show your customers how much you appreciate them.',
    price: '$29/mo',
    features: [
      { id: 'ref-1', label: 'Referral Tracking: Know exactly which customer gave you a referral with automated tracking or manual entry.' },
      { id: 'ref-2', label: 'Automated incentives: Send dollar or percentage-based credits for every successful referral — automatically.' },
      { id: 'ref-3', label: 'Referral Reporting: Track referrals generated, job revenue brought in, and credits issued.' },
    ],
  },
];
