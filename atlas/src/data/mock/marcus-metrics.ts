// Last-30-day performance metrics for Marcus Rivera (mock data)

export interface PolicyActionBreakdown {
  total: number;
  approved: number;
  overridden: number;
}

export interface SessionPrepRecord {
  date: string;
  clientName: string;
  prepTimeMinutes: number;
  sessionDurationMinutes: number;
}

export interface WeeklySessionCount {
  week: string;           // e.g. "Feb 17"
  completed: number;
  briefsGenerated: number;
}

export interface TopClient {
  clientName: string;
  entityType: string;
  sessionsCount: number;
  avgCsat: number;
}

export interface MarcusMetrics {
  periodLabel: string;          // "Last 30 Days"
  periodStart: string;          // ISO date
  periodEnd: string;

  // Session volume
  sessionsCompleted: number;
  sessionsScheduled: number;
  completionRate: number;       // 0–1

  // Client diversity
  uniqueClientsServed: number;
  newClientsOnboarded: number;
  repeatClients: number;
  topClients: TopClient[];

  // Policy actions
  totalPolicyActions: number;
  policyByRisk: {
    HIGH: PolicyActionBreakdown;
    MEDIUM: PolicyActionBreakdown;
    LOW: PolicyActionBreakdown;
  };
  totalApproved: number;
  totalOverridden: number;

  // Session prep time
  avgPrepTimeMinutes: number;
  maxPrepTimeMinutes: number;
  minPrepTimeMinutes: number;
  medianPrepTimeMinutes: number;
  prepTimeRecords: SessionPrepRecord[];

  // Weekly trend
  weeklyTrend: WeeklySessionCount[];

  // Atlas usage
  atlasAdoptionRate: number;    // briefs generated / sessions
  avgConfidenceScore: number;
  csatTrailing30: number;
}

export const marcusMetrics: MarcusMetrics = {
  periodLabel: 'Last 30 Days',
  periodStart: '2025-02-17',
  periodEnd: '2025-03-18',

  sessionsCompleted: 22,
  sessionsScheduled: 24,
  completionRate: 0.917,

  uniqueClientsServed: 14,
  newClientsOnboarded: 2,
  repeatClients: 12,

  topClients: [
    { clientName: 'Meridian Home Goods', entityType: 'S-Corp', sessionsCount: 4, avgCsat: 4.9 },
    { clientName: 'Apex Landscaping LLC', entityType: 'S-Corp', sessionsCount: 3, avgCsat: 5.0 },
    { clientName: 'Blue Ridge Bakery', entityType: 'Sole Proprietor', sessionsCount: 3, avgCsat: 4.8 },
    { clientName: 'TechStart Consulting', entityType: 'LLC', sessionsCount: 3, avgCsat: 4.9 },
    { clientName: 'Riviera Salon Group', entityType: 'S-Corp', sessionsCount: 3, avgCsat: 4.7 },
    { clientName: 'NextGen Fitness', entityType: 'C-Corp', sessionsCount: 2, avgCsat: 4.8 },
    { clientName: 'Coastal Realty Partners', entityType: 'LLC', sessionsCount: 2, avgCsat: 4.6 },
    { clientName: 'Harbor Light Brewing', entityType: 'S-Corp', sessionsCount: 2, avgCsat: 5.0 },
  ],

  totalPolicyActions: 44,
  policyByRisk: {
    HIGH: { total: 9, approved: 6, overridden: 3 },
    MEDIUM: { total: 24, approved: 21, overridden: 3 },
    LOW: { total: 11, approved: 11, overridden: 0 },
  },
  totalApproved: 38,
  totalOverridden: 6,

  avgPrepTimeMinutes: 4.2,
  maxPrepTimeMinutes: 11.5,
  minPrepTimeMinutes: 1.8,
  medianPrepTimeMinutes: 3.7,

  prepTimeRecords: [
    { date: 'Mar 18', clientName: 'Meridian Home Goods', prepTimeMinutes: 3.2, sessionDurationMinutes: 58 },
    { date: 'Mar 18', clientName: 'Riviera Salon Group', prepTimeMinutes: 2.9, sessionDurationMinutes: 0 },
    { date: 'Mar 18', clientName: 'TechStart Consulting', prepTimeMinutes: 4.1, sessionDurationMinutes: 61 },
    { date: 'Mar 17', clientName: 'Apex Landscaping LLC', prepTimeMinutes: 3.8, sessionDurationMinutes: 52 },
    { date: 'Mar 17', clientName: 'Coastal Realty Partners', prepTimeMinutes: 5.6, sessionDurationMinutes: 48 },
    { date: 'Mar 14', clientName: 'Harbor Light Brewing', prepTimeMinutes: 2.1, sessionDurationMinutes: 44 },
    { date: 'Mar 13', clientName: 'Blue Ridge Bakery', prepTimeMinutes: 1.8, sessionDurationMinutes: 49 },  // MIN
    { date: 'Mar 12', clientName: 'Meridian Home Goods', prepTimeMinutes: 3.5, sessionDurationMinutes: 63 },
    { date: 'Mar 11', clientName: 'NextGen Fitness', prepTimeMinutes: 7.2, sessionDurationMinutes: 55 },
    { date: 'Mar 10', clientName: 'Riviera Salon Group', prepTimeMinutes: 4.8, sessionDurationMinutes: 51 },
    { date: 'Mar 7', clientName: 'Apex Landscaping LLC', prepTimeMinutes: 3.1, sessionDurationMinutes: 47 },
    { date: 'Mar 6', clientName: 'TechStart Consulting', prepTimeMinutes: 6.3, sessionDurationMinutes: 58 },
    { date: 'Mar 5', clientName: 'Harbor Light Brewing', prepTimeMinutes: 2.4, sessionDurationMinutes: 42 },
    { date: 'Mar 4', clientName: 'Blue Ridge Bakery', prepTimeMinutes: 4.5, sessionDurationMinutes: 53 },
    { date: 'Mar 3', clientName: 'Meridian Home Goods', prepTimeMinutes: 3.9, sessionDurationMinutes: 61 },
    { date: 'Feb 28', clientName: 'Coastal Realty Partners', prepTimeMinutes: 11.5, sessionDurationMinutes: 67 }, // MAX
    { date: 'Feb 27', clientName: 'NextGen Fitness', prepTimeMinutes: 5.1, sessionDurationMinutes: 54 },
    { date: 'Feb 26', clientName: 'Riviera Salon Group', prepTimeMinutes: 3.3, sessionDurationMinutes: 48 },
    { date: 'Feb 25', clientName: 'Apex Landscaping LLC', prepTimeMinutes: 2.8, sessionDurationMinutes: 46 },
    { date: 'Feb 24', clientName: 'TechStart Consulting', prepTimeMinutes: 4.7, sessionDurationMinutes: 59 },
    { date: 'Feb 21', clientName: 'Blue Ridge Bakery', prepTimeMinutes: 3.6, sessionDurationMinutes: 50 },
    { date: 'Feb 20', clientName: 'Meridian Home Goods', prepTimeMinutes: 4.2, sessionDurationMinutes: 65 },
  ],

  weeklyTrend: [
    { week: 'Feb 17', completed: 5, briefsGenerated: 5 },
    { week: 'Feb 24', completed: 6, briefsGenerated: 6 },
    { week: 'Mar 3', completed: 6, briefsGenerated: 5 },
    { week: 'Mar 10', completed: 5, briefsGenerated: 5 },
  ],

  atlasAdoptionRate: 0.94,
  avgConfidenceScore: 0.87,
  csatTrailing30: 4.87,
};
