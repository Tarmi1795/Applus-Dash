import React, { useState } from 'react';
import { RawContractData } from '../types';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface PreviewerProps {
  data: RawContractData[];
  onConfirm: (data: RawContractData[]) => void;
  onCancel: () => void;
}

export const Previewer: React.FC<PreviewerProps> = ({ data, onConfirm, onCancel }) => {
  const [editableData, setEditableData] = useState<RawContractData[]>(data);
  const [isProcessing, setIsProcessing] = useState(false);
  const headers = Object.keys(data[0] || {});

  const handleCellChange = (rowIndex: number, key: keyof RawContractData, value: string) => {
    const newData = [...editableData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setEditableData(newData);
  };

  const formatValue = (val: any, header: string) => {
    if (val === null || val === undefined || val === '') return '';
    
    // Check if it's a date column
    const isDateColumn = header.toLowerCase().includes('date');
    
    if (isDateColumn) {
      const date = new Date(val);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy');
      }
    }

    const strVal = String(val);
    const num = parseFloat(strVal.replace(/,/g, ''));
    return !isNaN(num) && !isDateColumn ? num.toLocaleString('en-US') : strVal;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConfirm(editableData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1600px] mx-auto p-8 space-y-8 font-sans"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">File Preview</h2>
        {!isProcessing && (
          <div className="flex gap-4">
            <button onClick={onCancel} className="px-6 py-2 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={isProcessing}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Confirm & Process'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
              {headers.map(h => (
                <th key={h} className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                {headers.map(h => (
                  <td key={h} className="p-2">
                    <input
                      type="text"
                      value={formatValue(row[h as keyof RawContractData], h)}
                      onChange={(e) => handleCellChange(rowIndex, h as keyof RawContractData, e.target.value.replace(/,/g, ''))}
                      className="w-full bg-transparent p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
