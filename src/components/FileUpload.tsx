import React, { useCallback, useState } from 'react';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTemplate, parseFile } from '../utils/fileUtils';
import { RawContractData } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: RawContractData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      // Artificial delay for "mechanical" feel
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = await parseFile(file);
      if (data && data.length > 0) {
        onDataLoaded(data);
      } else {
        setError('DATASET_NULL_OR_INVALID');
      }
    } catch (err) {
      setError('PARSING_FAILURE_ENCOUNTERED');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-6 py-20 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #D97706 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Context */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="lg:col-span-5 space-y-8"
        >
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">System v2.0 // Contract Analysis Dashboard</span>
            <h1 className="text-6xl md:text-7xl font-light leading-[0.9] tracking-tighter">
              Applus <br />
              <span className="italic font-serif text-copper">Velosi.</span>
            </h1>
          </div>
          
          <p className="text-gray-400 font-sans text-sm leading-relaxed max-w-sm">
            Transform raw, inconsistent project data into a precision-prorated monthly revenue model. 
            Engineered for absolute accuracy in financial forecasting.
          </p>

          <div className="pt-4">
            <button 
              onClick={generateTemplate}
              className="group flex items-center gap-4 px-6 py-3 bg-copper/10 border border-copper/30 rounded-lg hover:bg-copper hover:text-obsidian transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.1)] hover:shadow-[0_0_30px_rgba(217,119,6,0.3)]"
            >
              <FileText className="w-4 h-4 text-copper group-hover:text-obsidian transition-colors" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em]">Download Blank Template</span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </div>
        </motion.div>

        {/* Right Column: Upload Zone */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
          className="lg:col-span-7"
        >
          <div
            className={`relative group h-[450px] border border-white/10 bg-slate-dark/50 backdrop-blur-sm transition-all duration-500 overflow-hidden
              ${isDragging ? 'border-copper scale-[1.02]' : 'hover:border-white/20'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="noise-bg" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-copper/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-copper/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-copper/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-copper/40" />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="w-12 h-12 border-2 border-copper border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-copper">Analyzing Data Stream...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="relative inline-block">
                      <Upload className={`w-12 h-12 transition-transform duration-500 ${isDragging ? 'scale-110 text-copper' : 'text-gray-600 group-hover:text-gray-400'}`} />
                      <div className="absolute -inset-4 border border-copper/0 group-hover:border-copper/20 rounded-full transition-all duration-500 animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif italic text-white">Initialize Upload</h3>
                      <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                        Drag CSV/XLSX or <span className="text-copper underline cursor-pointer">Browse Local</span>
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-gray-600 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> UTF-8</span>
                      <span className="w-1 h-1 bg-gray-800 rounded-full" />
                      <span>CSV / XLSX</span>
                      <span className="w-1 h-1 bg-gray-800 rounded-full" />
                      <span>Max 50MB</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 border border-red-900/50 bg-red-950/20 text-red-500 font-mono text-[10px] uppercase tracking-widest flex items-center justify-between"
              >
                <span>ERROR: {error}</span>
                <button onClick={() => setError(null)} className="hover:text-white">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

