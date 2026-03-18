export interface ExpertProfile {
  expertId: string;
  name: string;
  initials: string;
  credentials: string[];
  yearsWithIntuit: number;
  specialty: string;
  csatTrailing30Days: number;
  atlasAdoptionRate: number;
}

export type SessionStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PREP_READY' | 'NOT_STARTED';

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

export const expertProfile: ExpertProfile = {
  expertId: 'exp-marcus-001',
  name: 'Marcus Rivera',
  initials: 'MR',
  credentials: ['CPA', 'QuickBooks ProAdvisor Certified', 'TurboTax Live Business Certified'],
  yearsWithIntuit: 4,
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
    briefReady: true,
    pendingActions: 1,
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

export const sessionStats = {
  totalToday: todaySessions.length,
  completed: todaySessions.filter(s => s.status === 'COMPLETED').length,
  inProgress: todaySessions.filter(s => s.status === 'IN_PROGRESS').length,
  upcoming: todaySessions.filter(s => s.status === 'PREP_READY' || s.status === 'NOT_STARTED').length,
  avgCsat: +(
    todaySessions
      .filter(s => s.csatScore)
      .reduce((sum, s) => sum + (s.csatScore ?? 0), 0) /
    todaySessions.filter(s => s.csatScore).length
  ).toFixed(2),
};
