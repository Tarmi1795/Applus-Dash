export interface RawContractData {
  'Serial No.': string;
  'Customer Name': string;
  'CONTRACT NO.': string;
  'WBS': string;
  ' Dhareeba No. ': string;
  'Billing Currency (short name)': string;
  'Project Country Location': string;
  'Signing Date (per contract)-dd/mm/yyy': string;
  'Start Date (per contract)-dd/mm/yyy': string;
  'Est. Completion Date-dd/mm/yyy': string;
  'Total Contract Revenue Value *1000 (Est.)': string;
  'Contract Value QAR': string;
  'Remarks': string;
  'DEPARTMENT': string;
  'Comparison remarks (local vs. Dhareeba)': string;
}

export interface ProratedMonth {
  month: Date;
  value: number;
}

export interface ProcessedContract {
  id: string;
  contractNo: string;
  client: string;
  department: string;
  totalValue: number;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  monthlyValue: number;
  recognizedRevenue: number;
  remainingBalance: number;
  proratedMonths: ProratedMonth[];
}

export interface DashboardMetrics {
  totalContractValue: number;
  totalRemainingBalance: number;
  activeContractsCount: number;
}
