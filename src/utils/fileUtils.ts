import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RawContractData } from '../types';

export const parseCSV = (file: File): Promise<RawContractData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<RawContractData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const parseExcel = (file: File): Promise<RawContractData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // cellDates: true converts date cells to JS Date objects
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // raw: false ensures we get formatted strings if possible, but we want to handle formatting ourselves for consistency
        const jsonData = XLSX.utils.sheet_to_json<RawContractData>(worksheet, {
          defval: '',
        });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parseFile = async (file: File): Promise<RawContractData[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
};

export const generateTemplate = () => {
  const headers = [
    'Serial No.',
    'Customer Name',
    'CONTRACT NO.',
    'WBS',
    ' Dhareeba No. ',
    'Billing Currency (short name)',
    'Project Country Location',
    'Signing Date (per contract)-dd/mm/yyy',
    'Start Date (per contract)-dd/mm/yyy',
    'Est. Completion Date-dd/mm/yyy',
    'Total Contract Revenue Value *1000 (Est.)',
    'Contract Value QAR',
    'Remarks',
    'DEPARTMENT',
    'Comparison remarks (local vs. Dhareeba)'
  ];
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'financial_contract_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
