import { RevenueData } from '../types/snapshot';

export const stripeData: RevenueData = {
  stripe: {
    gross: 12_548_000,
    refunds: 148_000,
    fees: 376_440,
  },
  recognized: 12_400_000,
  deferred: 176_000,
  monthlyGross: [
    { month: 'Jan 2025', amount: 931_000 },
    { month: 'Feb 2025', amount: 892_000 },
    { month: 'Mar 2025', amount: 1_063_000 },
    { month: 'Apr 2025', amount: 1_022_000 },
    { month: 'May 2025', amount: 982_000 },
    { month: 'Jun 2025', amount: 1_135_000 },
    { month: 'Jul 2025', amount: 1_093_000 },
    { month: 'Aug 2025', amount: 1_214_000 },
    { month: 'Sep 2025', amount: 1_163_000 },
    { month: 'Oct 2025', amount: 1_325_000 },
    { month: 'Nov 2025', amount: 1_444_000 },
    { month: 'Dec 2025', amount: 284_000 },
  ],
  threshold1099K: true,
};
