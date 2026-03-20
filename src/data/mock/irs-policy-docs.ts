export const irsPolicyDocs = [
  {
    id: 'pub535',
    title: 'IRS Publication 535 — Business Expenses',
    summary: 'Covers what business expenses are deductible, including meals (50%), travel (100%), home office (exclusive use required), and vehicle expenses.',
    keyRules: [
      'Meals: 50% deductible with business purpose documented',
      'Entertainment: 0% deductible post-TCJA (2018+)',
      'Home office: Requires exclusive and regular use',
      'Travel: 100% deductible with business purpose',
    ],
  },
  {
    id: 'pub15',
    title: 'IRS Publication 15 — Employer\'s Tax Guide',
    summary: 'Covers employer payroll tax obligations, deposit schedules, and worker classification rules.',
    keyRules: [
      'FICA: 7.65% employer match (6.2% SS + 1.45% Medicare)',
      'FUTA: 6% on first $7,000 per employee (reduced by SUTA credit)',
      'Semi-weekly depositors must deposit within 3 business days',
      '1099 contractors: File 1099-NEC for payments over $600',
    ],
  },
  {
    id: 'pub946',
    title: 'IRS Publication 946 — Depreciation',
    summary: 'Covers Section 179 expensing, bonus depreciation, and MACRS depreciation schedules.',
    keyRules: [
      'Section 179: Up to $1.16M deduction (2025), phase-out begins at $2.89M',
      'Bonus depreciation: 40% for 2025 (declining phase-out)',
      'Section 179 recapture if asset sold before recovery period ends',
      '5-year MACRS for computers and equipment',
    ],
  },
  {
    id: 'sec199a',
    title: 'IRC Section 199A — Qualified Business Income Deduction',
    summary: 'Allows eligible pass-through entities to deduct up to 20% of qualified business income.',
    keyRules: [
      '20% deduction on QBI for non-SSTB businesses',
      'Phase-out begins at $383,900 (MFJ) / $191,950 (single) for 2025',
      'S-Corps: QBI is net of reasonable compensation',
      'W-2 wage limitation applies above threshold',
    ],
  },
];

export const meridianPolicies = {
  expensePolicy: {
    mealLimit: 75,
    travelDailyLimit: 300,
    requiresReceiptsAbove: 25,
    preApprovalRequired: 1_000,
    homeOfficeAllowance: 50,
  },
  capitalizationPolicy: {
    threshold: 2_500,
    usefulLifeYears: 5,
    depreciationMethod: 'Straight-line or Section 179',
  },
};
