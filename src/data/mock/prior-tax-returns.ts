import { TaxHistoryData } from '../types/snapshot';

export const priorTaxReturnsData: TaxHistoryData = {
  priorYearReturns: [
    {
      year: 2024,
      form: '1120-S',
      federalTaxableIncome: 1_620_000,
      federalTax: 345_060,
      stateTax: 129_600,
      effectiveTaxRate: 0.2931,
    },
    {
      year: 2023,
      form: '1120-S',
      federalTaxableIncome: 1_380_000,
      federalTax: 293_940,
      stateTax: 110_400,
      effectiveTaxRate: 0.2929,
    },
    {
      year: 2022,
      form: '1120-S',
      federalTaxableIncome: 1_140_000,
      federalTax: 242_820,
      stateTax: 91_200,
      effectiveTaxRate: 0.2982,
    },
  ],
  effectiveTaxRates: [
    { year: 2022, rate: 0.2982 },
    { year: 2023, rate: 0.2929 },
    { year: 2024, rate: 0.2931 },
  ],
  carryforwards: [],
};
