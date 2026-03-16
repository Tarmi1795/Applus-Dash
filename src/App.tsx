/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Previewer } from './components/Previewer';
import { processContractData } from './utils/dataParser';
import { ProcessedContract, RawContractData } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { LayoutDashboard, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [rawData, setRawData] = useState<RawContractData[] | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedContract[] | null>(null);
  const [activeView, setActiveView] = useState<'upload' | 'preview' | 'dashboard'>('upload');

  // Check for data from the API on mount
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setRawData(data);
            setProcessedData(processContractData(data));
            setActiveView('dashboard');
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest data:', error);
      }
    };
    fetchLatestData();
  }, []);

  const handleDataLoaded = (data: RawContractData[]) => {
    setRawData(data);
    setActiveView('preview');
  };

  const handleConfirm = (updatedData: RawContractData[]) => {
    setRawData(updatedData);
    setProcessedData(processContractData(updatedData));
    setActiveView('dashboard');
  };

  const handleCancel = () => {
    setRawData(null);
    setProcessedData(null);
    setActiveView('upload');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
        {activeView === 'preview' && rawData && (
          <nav className="border-b border-white/10 bg-[#121626]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
            <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setActiveView('preview')} 
                  className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'preview' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Preview Excel File
                </button>
                <button 
                  onClick={() => setActiveView('dashboard')} 
                  className={`px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>
              </div>
            </div>
          </nav>
        )}
        
        {activeView === 'upload' ? (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : activeView === 'preview' && rawData ? (
          <Previewer data={rawData} onConfirm={handleConfirm} onCancel={handleCancel} />
        ) : (
          processedData && <Dashboard data={processedData} onNavigate={(view) => setActiveView(view)} />
        )}
      </div>
    </ThemeProvider>
  );
}
