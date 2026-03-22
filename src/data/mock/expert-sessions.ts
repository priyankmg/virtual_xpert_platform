export interface ExpertProfile {
  expertId: string;
  name: string;
  initials: string;
  credentials: string[];
  yearsWithPlatform: number;
  specialty: string;
  csatTrailing30Days: number;
  atlasAdoptionRate: number;
}

export type SessionStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'PREP_READY'
  | 'BRIEF_COMPLETE'
  | 'NOT_STARTED';

export interface SessionItem {
  sessionId: string;
  clientId: string;
  clientName: string;
  entityType: string;
  topic: string;
  scheduledTime: string;
  status: SessionStatus;
  briefReady: boolean;
  pendingActions: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  csatScore?: number;
  durationMinutes?: number;
}

export interface CommunicationEntry {
  date: string;
  type: 'SESSION' | 'EMAIL' | 'NOTE';
  summary: string;
  topicsDiscussed: string[];
  actionItems: string[];
  nextSteps: string[];
  completedItems?: string[];
}

export interface ClientHistory {
  clientId: string;
  clientName: string;
  communications: CommunicationEntry[];
  openActionItems: string[];
  keyContext: string;
}

export const expertProfile: ExpertProfile = {
  expertId: 'exp-marcus-001',
  name: 'Marcus Rivera',
  initials: 'MR',
  credentials: ['CPA', 'QuickBooks ProAdvisor Certified', 'TurboTax Live Business Certified'],
  yearsWithPlatform: 4,
  specialty: 'SMB accounting, S-Corp tax, payroll compliance',
  csatTrailing30Days: 4.87,
  atlasAdoptionRate: 0.94,
};

export const todaySessions: SessionItem[] = [
  {
    sessionId: 'sess-001',
    clientId: 'CLIENT-011',
    clientName: 'Apex Landscaping LLC',
    entityType: 'S-Corp',
    topic: 'Payroll review & Q3 941 reconciliation',
    scheduledTime: '9:00 AM',
    status: 'COMPLETED',
    briefReady: true,
    pendingActions: 0,
    riskLevel: 'LOW',
    csatScore: 5.0,
    durationMinutes: 52,
  },
  {
    sessionId: 'sess-002',
    clientId: 'CLIENT-012',
    clientName: 'Blue Ridge Bakery',
    entityType: 'Sole Proprietor',
    topic: 'Schedule C review & home office deduction',
    scheduledTime: '10:30 AM',
    status: 'COMPLETED',
    briefReady: true,
    pendingActions: 0,
    riskLevel: 'MEDIUM',
    csatScore: 4.8,
    durationMinutes: 48,
  },
  {
    sessionId: 'sess-003',
    clientId: 'CLIENT-013',
    clientName: 'TechStart Consulting',
    entityType: 'LLC',
    topic: 'Q3 quarterly close & contractor payments',
    scheduledTime: '12:00 PM',
    status: 'COMPLETED',
    briefReady: true,
    pendingActions: 0,
    riskLevel: 'MEDIUM',
    csatScore: 4.9,
    durationMinutes: 61,
  },
  {
    sessionId: 'sess-004',
    clientId: 'CLIENT-001',
    clientName: 'Meridian Home Goods',
    entityType: 'S-Corp',
    topic: 'Q4 tax readiness review — Sarah Chen',
    scheduledTime: '2:00 PM',
    status: 'IN_PROGRESS',
    briefReady: true,
    pendingActions: 3,
    riskLevel: 'HIGH',
  },
  {
    sessionId: 'sess-005',
    clientId: 'CLIENT-014',
    clientName: 'Riviera Salon Group',
    entityType: 'S-Corp',
    topic: 'Payroll tax compliance & FUTA review',
    scheduledTime: '3:30 PM',
    status: 'PREP_READY',
    briefReady: false,
    pendingActions: 0,
    riskLevel: 'MEDIUM',
  },
  {
    sessionId: 'sess-006',
    clientId: 'CLIENT-015',
    clientName: 'NextGen Fitness',
    entityType: 'C-Corp',
    topic: 'Year-end close & depreciation review',
    scheduledTime: '4:30 PM',
    status: 'NOT_STARTED',
    briefReady: false,
    pendingActions: 0,
    riskLevel: 'LOW',
  },
];

export const clientHistory: Record<string, ClientHistory> = {
  'CLIENT-001': {
    clientId: 'CLIENT-001',
    clientName: 'Meridian Home Goods',
    keyContext:
      'Sarah Chen is the Controller at Meridian Home Goods, an S-Corp with 85 employees and ~$12M annual revenue. She is detail-oriented and prefers to understand the "why" behind each recommendation before acting. Has been on the platform for 6 years.',
    openActionItems: [
      'Sarah to provide signed lease agreement for home office review (due Jan 22 — still outstanding)',
      'Marcus to confirm Section 179 strategy on delivery van ($38K) before year-end filing',
      'Payroll reclassification of 2 contractors — Sarah to initiate W-2 setup in ADP',
    ],
    communications: [
      {
        date: 'January 15, 2025',
        type: 'SESSION',
        summary:
          'Q3 bookkeeping reconciliation session. Reviewed YTD P&L and identified three reconciliation flags between QuickBooks and Stripe. Sarah raised a question about home office deductibility for her CFO who works remotely.',
        topicsDiscussed: [
          'Q3 P&L reconciliation — $14,200 discrepancy between QBO and Stripe resolved',
          'Home office deduction eligibility for remote CFO (IRC §280A exclusive use test)',
          'Estimated Q3 tax payment — confirmed $78,400 paid on time',
          'ADP payroll register review — two payroll periods had incorrect FICA withholding',
        ],
        actionItems: [
          'Sarah to provide signed lease agreement documenting home office space',
          'Marcus to research §280A exclusive use requirement and respond by Jan 22',
          'ADP payroll correction to be processed in next payroll cycle',
        ],
        nextSteps: [
          'Schedule Q4 readiness session for March — focus on year-end tax positioning',
          'Sarah to flag any new contractor relationships started in Q4',
        ],
        completedItems: [
          'Q3 reconciliation flags resolved',
          'Estimated Q3 payment confirmed',
        ],
      },
      {
        date: 'October 10, 2024',
        type: 'SESSION',
        summary:
          'Q3 estimated tax payment review and contractor classification discussion. Two workers flagged as potential employee misclassification risk based on behavioral control test. Sarah expressed concern about retroactive FICA exposure.',
        topicsDiscussed: [
          'Q3 estimated tax payment calculation — $78,400 recommended',
          'Contractor classification review — 2 of 7 contractors flagged as high-risk',
          'S-Corp reasonable compensation — current salary of $95K reviewed against industry benchmarks',
          'Section 179 election opportunity on new delivery van purchased Q3',
        ],
        actionItems: [
          'Sarah to reclassify 2 flagged contractors as W-2 employees starting Q4',
          'Marcus to confirm Section 179 election before year-end',
          'Review S-Corp salary against QuickBooks Live compensation benchmarks',
        ],
        nextSteps: [
          'Follow up on contractor reclassification in January session',
          'Confirm Q3 estimated tax payment processed',
        ],
        completedItems: [
          'Q3 estimated tax payment of $78,400 confirmed paid Oct 15',
          'S-Corp salary benchmark review completed — $95K within acceptable range',
        ],
      },
      {
        date: 'July 12, 2024',
        type: 'SESSION',
        summary:
          'Mid-year review and Q2 close. Strong revenue growth noted (+18% vs prior year). Discussed QBI deduction eligibility and inventory write-down accounting for slow-moving SKUs.',
        topicsDiscussed: [
          'Q2 close — net income $890K YTD, on track for record year',
          'QBI deduction eligibility (IRC §199A) — confirmed S-Corp qualifies at current income level',
          'Inventory write-down of $42K for obsolete SKUs — lower of cost or market method',
          'Stripe 1099-K threshold tracking — on track to exceed $20K threshold',
        ],
        actionItems: [
          'Document inventory write-down methodology for audit support',
          'Begin tracking Q3 estimated tax based on updated projections',
        ],
        nextSteps: [
          'Q3 estimated tax review in October',
          'Flag any significant asset purchases in Q3/Q4 for depreciation planning',
        ],
        completedItems: [
          'QBI deduction eligibility confirmed',
          'Inventory write-down documented',
        ],
      },
    ],
  },
  'CLIENT-014': {
    clientId: 'CLIENT-014',
    clientName: 'Riviera Salon Group',
    keyContext:
      'Multi-location salon group, S-Corp. Owner is expanding to 4th location. Payroll compliance has been a recurring issue — missed FTD deadlines in prior year.',
    openActionItems: [
      'Confirm Q4 941 payment schedule after expansion hire',
      'Review FUTA rate for California operations',
    ],
    communications: [
      {
        date: 'December 4, 2024',
        type: 'SESSION',
        summary: 'Q4 payroll planning and FUTA review. Owner expanding headcount by 12 employees.',
        topicsDiscussed: ['FUTA calculation for CA', 'Q4 941 deposit schedule', 'New hire onboarding in ADP'],
        actionItems: ['Update ADP with new hire records', 'Confirm FUTA rate with CA EDD'],
        nextSteps: ['Review FUTA liability in March session'],
      },
    ],
  },
  'CLIENT-015': {
    clientId: 'CLIENT-015',
    clientName: 'NextGen Fitness',
    keyContext: 'C-Corp, 3 gym locations. First year on the platform. Year-end close is primary focus.',
    openActionItems: ['Collect all fixed asset records for depreciation schedule'],
    communications: [
      {
        date: 'November 20, 2024',
        type: 'SESSION',
        summary: 'Onboarding session. Reviewed chart of accounts and set up QuickBooks.',
        topicsDiscussed: ['Chart of accounts setup', 'Fixed asset register', 'Depreciation schedule'],
        actionItems: ['Client to provide all fixed asset purchase records'],
        nextSteps: ['Year-end close session in March'],
      },
    ],
  },
};

export const sessionStats = {
  totalToday: todaySessions.length,
  completed: todaySessions.filter(s => s.status === 'COMPLETED').length,
  inProgress: todaySessions.filter(s => s.status === 'IN_PROGRESS').length,
  upcoming: todaySessions.filter(
    s => s.status === 'PREP_READY' || s.status === 'NOT_STARTED' || s.status === 'BRIEF_COMPLETE'
  ).length,
  avgCsat: +(
    todaySessions
      .filter(s => s.csatScore)
      .reduce((sum, s) => sum + (s.csatScore ?? 0), 0) /
    todaySessions.filter(s => s.csatScore).length
  ).toFixed(2),
};
