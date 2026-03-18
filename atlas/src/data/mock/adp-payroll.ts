import { PayrollData } from '../types/snapshot';

export const adpPayrollData: PayrollData = {
  totalWages: 3_200_000,
  employerTaxes: 244_800,
  benefitsDeductions: 312_000,
  contractorPayments: 184_000,
  filingStatus: {
    form941: 'FILED',
    form940: 'FILED',
  },
  employees: [
    { id: 'E001', name: 'Sarah Chen', ytdWages: 185_000, ytdWithholding: 42_550, benefits: 8_400, isContractor: false },
    { id: 'E002', name: 'Marcus Webb', ytdWages: 145_000, ytdWithholding: 33_350, benefits: 8_400, isContractor: false },
    { id: 'E003', name: 'Priya Sharma', ytdWages: 138_000, ytdWithholding: 31_740, benefits: 8_400, isContractor: false },
    { id: 'E004', name: 'Jason Liu', ytdWages: 92_000, ytdWithholding: 21_160, benefits: 6_000, isContractor: false },
    { id: 'E005', name: 'Amara Osei', ytdWages: 88_000, ytdWithholding: 20_240, benefits: 6_000, isContractor: false },
    { id: 'E006', name: 'Tom Rivera', ytdWages: 78_000, ytdWithholding: 17_940, benefits: 6_000, isContractor: false },
    { id: 'E007', name: 'Dana Kim', ytdWages: 72_000, ytdWithholding: 16_560, benefits: 4_800, isContractor: false },
    { id: 'C001', name: 'Alexis Grant (Contractor)', ytdWages: 64_000, ytdWithholding: 0, benefits: 0, isContractor: true },
    { id: 'C002', name: 'Raj Patel (Contractor)', ytdWages: 52_000, ytdWithholding: 0, benefits: 0, isContractor: true },
    { id: 'C003', name: 'Morgan Lee (Contractor)', ytdWages: 38_000, ytdWithholding: 0, benefits: 0, isContractor: true },
    { id: 'C004', name: 'Chris Novak (Contractor)', ytdWages: 30_000, ytdWithholding: 0, benefits: 0, isContractor: true },
  ],
};
