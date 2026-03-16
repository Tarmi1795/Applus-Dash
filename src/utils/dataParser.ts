import { differenceInMonths, parse, isValid, startOfMonth, addMonths, isBefore } from 'date-fns';
import { RawContractData, ProcessedContract, ProratedMonth } from '../types';

const cleanValue = (val: string | undefined | null): number => {
  if (!val) return 0;
  // Strip everything except digits, minus sign, and decimal point
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseDate = (dateVal: any, defaultDate: Date): Date => {
  if (!dateVal) return defaultDate;
  
  // If it's already a Date object (from xlsx)
  if (dateVal instanceof Date && isValid(dateVal)) {
    return dateVal;
  }

  const dateStr = String(dateVal).trim();
  if (dateStr === '') return defaultDate;
  
  // Replace dots with slashes
  const cleanedStr = dateStr.replace(/\./g, '/');
  
  // Try parsing common formats (DD/MM/YYYY or MM/DD/YYYY)
  // Assuming DD/MM/YYYY as standard for international dates, but fallback to native Date parsing if needed
  let parsed = parse(cleanedStr, 'dd/MM/yyyy', new Date());
  
  if (!isValid(parsed)) {
    parsed = parse(cleanedStr, 'MM/dd/yyyy', new Date());
  }
  
  if (!isValid(parsed)) {
    parsed = new Date(cleanedStr);
  }
  
  return isValid(parsed) ? parsed : defaultDate;
};

export const processContractData = (rawData: RawContractData[]): ProcessedContract[] => {
  const today = startOfMonth(new Date());

  const departments = ['VSS', 'TSS', 'NDT', 'TPI'];

  return rawData.map((row, index) => {
    const client = String(row['Customer Name'] || 'Unknown Client');
    const contractNo = String(row['CONTRACT NO.'] || `UNKNOWN-${index}`);
    const id = `${contractNo}-${index}`;
    // Use the DEPARTMENT column if provided, otherwise fallback to random assignment
    const department = String(row['DEPARTMENT'] || departments[index % departments.length]);
    const totalValue = cleanValue(row['Contract Value QAR']);
    
    let startDate = parseDate(row['Start Date (per contract)-dd/mm/yyy'], new Date(2024, 0, 1)); // Default 01/01/2024
    let endDate = parseDate(row['Est. Completion Date-dd/mm/yyy'], startDate);

    // Ensure startDate is start of month for consistent math
    startDate = startOfMonth(startDate);
    endDate = startOfMonth(endDate);

    // If end date is before start date, adjust it
    if (isBefore(endDate, startDate)) {
      endDate = startDate;
    }

    let durationMonths = differenceInMonths(endDate, startDate) + 1;
    
    // Fallback if dates were missing or invalid
    if (durationMonths < 1 || isNaN(durationMonths)) {
      durationMonths = 1;
    }

    const monthlyValue = totalValue / durationMonths;
    
    let recognizedRevenue = 0;
    let remainingBalance = 0;
    const proratedMonths: ProratedMonth[] = [];

    for (let i = 0; i < durationMonths; i++) {
      const currentMonth = addMonths(startDate, i);
      proratedMonths.push({
        month: currentMonth,
        value: monthlyValue
      });

      if (isBefore(currentMonth, today)) {
        recognizedRevenue += monthlyValue;
      } else {
        remainingBalance += monthlyValue;
      }
    }

    return {
      id,
      contractNo,
      client,
      department,
      totalValue,
      startDate,
      endDate,
      durationMonths,
      monthlyValue,
      recognizedRevenue,
      remainingBalance,
      proratedMonths
    };
  });
};
