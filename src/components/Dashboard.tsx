import React, { useMemo, useState, useEffect } from 'react';
import { ProcessedContract } from '../types';
import { format, startOfMonth, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, FileText, Calendar, Filter, ChevronDown, ChevronUp, Sun, Moon, Maximize2, Minimize2, Search, LayoutDashboard, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  data: ProcessedContract[];
  onNavigate: (view: 'preview' | 'dashboard') => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#D97706', '#B45309', '#92400E', '#78350F', '#451A03', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-copper/30 p-4 shadow-xl">
        <p className="font-mono text-[10px] text-slate-500 dark:text-copper uppercase tracking-widest mb-2">{label}</p>
        <p className="text-xl font-semibold text-slate-900 dark:text-white">
          {formatCurrency(payload[0].value)} <span className="text-[10px] uppercase font-mono text-slate-400">QAR</span>
        </p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedContract, setSelectedContract] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [contractSearch, setContractSearch] = useState<string>('');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [startDateSearch, setStartDateSearch] = useState<string>('');
  const [endDateSearch, setEndDateSearch] = useState<string>('');
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [isContractsExpanded, setIsContractsExpanded] = useState(false);
  const [isClientsExpanded, setIsClientsExpanded] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const clients = useMemo(() => {
    const c = new Set<string>();
    data.forEach(contract => {
      if (selectedDepartment !== 'All' && contract.department !== selectedDepartment) return;
      if (clientSearch && !contract.client.toLowerCase().includes(clientSearch.toLowerCase())) return;
      c.add(contract.client);
    });
    return ['All', ...Array.from(c).sort()];
  }, [data, selectedDepartment, clientSearch]);

  const contractOptions = useMemo(() => {
    const c = new Set<string>();
    data.forEach(contract => {
      if (selectedDepartment !== 'All' && contract.department !== selectedDepartment) return;
      if (selectedClient !== 'All' && contract.client !== selectedClient) return;
      if (contractSearch && !contract.contractNo.toLowerCase().includes(contractSearch.toLowerCase())) return;
      c.add(contract.contractNo);
    });
    return ['All', ...Array.from(c).sort()];
  }, [data, selectedClient, selectedDepartment, contractSearch]);

  const departments = useMemo(() => {
    const d = new Set<string>();
    data.forEach(contract => {
      if (deptSearch && !contract.department.toLowerCase().includes(deptSearch.toLowerCase())) return;
      d.add(contract.department);
    });
    return ['All', ...Array.from(d).sort()];
  }, [data, deptSearch]);

  // Reset client if it's no longer in the filtered list
  useEffect(() => {
    if (selectedClient !== 'All' && !clients.includes(selectedClient)) {
      setSelectedClient('All');
    }
  }, [clients, selectedClient]);

  // Reset contract if it's no longer in the filtered list
  useEffect(() => {
    if (selectedContract !== 'All' && !contractOptions.includes(selectedContract)) {
      setSelectedContract('All');
    }
  }, [contractOptions, selectedContract]);

  const metrics = useMemo(() => {
    let totalContractValue = 0;
    let totalRemainingBalance = 0;
    const activeContracts = new Set<string>();

    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let contractValueInPeriod = 0;
      let remainingBalanceInPeriod = 0;
      let isActiveInPeriod = false;

      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        
        if (isInRange) {
          isActiveInPeriod = true;
          contractValueInPeriod += pm.value;
          if (pm.month >= startOfMonth(new Date())) {
            remainingBalanceInPeriod += pm.value;
          }
        }
      });

      if (isActiveInPeriod) {
        activeContracts.add(c.id);
        if (!start && !end) {
          totalContractValue += c.totalValue;
          totalRemainingBalance += c.remainingBalance;
        } else {
          totalContractValue += contractValueInPeriod;
          totalRemainingBalance += remainingBalanceInPeriod;
        }
      }
    });

    return { totalContractValue, totalRemainingBalance, activeContractsCount: activeContracts.size };
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  const monthlyTrendData = useMemo(() => {
    const trendMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      c.proratedMonths.forEach(pm => {
        const year = parseInt(format(pm.month, 'yyyy'));
        if (year < 2020) return;
        
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        
        if (isInRange) {
          const key = viewType === 'monthly' 
            ? format(pm.month, 'MMM yyyy')
            : format(pm.month, 'yyyy');
          trendMap.set(key, (trendMap.get(key) || 0) + pm.value);
        }
      });
    });
    const sortedKeys = Array.from(trendMap.keys()).sort((a, b) => {
      if (viewType === 'yearly') return parseInt(a) - parseInt(b);
      return new Date(a).getTime() - new Date(b).getTime();
    });
    return sortedKeys.map(key => ({ name: key, Revenue: trendMap.get(key) || 0 }));
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment, viewType]);

  const runningBalanceData = useMemo(() => {
    const timeMap = new Map<string, Date>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      c.proratedMonths.forEach(pm => {
        const year = parseInt(format(pm.month, 'yyyy'));
        if (year < 2020) return;
        
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange) {
          const key = viewType === 'monthly' 
            ? format(pm.month, 'yyyy-MM')
            : format(pm.month, 'yyyy');
          
          // For yearly, we want the balance at the end of the year (or latest month in range)
          if (!timeMap.has(key) || pm.month > timeMap.get(key)!) {
            timeMap.set(key, pm.month);
          }
        }
      });
    });

    const sortedKeys = Array.from(timeMap.keys()).sort();
    
    return sortedKeys.map(key => {
      const targetDate = timeMap.get(key)!;
      let totalRemainingAtDate = 0;

      data.forEach(c => {
        if (selectedClient !== 'All' && c.client !== selectedClient) return;
        if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
        if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

        let recognizedUpToDate = 0;
        c.proratedMonths.forEach(pm => {
          if (pm.month <= targetDate) {
            recognizedUpToDate += pm.value;
          }
        });
        
        const balance = Math.max(0, c.totalValue - recognizedUpToDate);
        totalRemainingAtDate += balance;
      });

      return {
        name: viewType === 'monthly' ? format(targetDate, 'MMM yyyy') : format(targetDate, 'yyyy'),
        Balance: totalRemainingAtDate
      };
    });
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment, viewType]);

  const topClientsData = useMemo(() => {
    const clientMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let revenueInPeriod = 0;
      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange) revenueInPeriod += pm.value;
      });
      if (revenueInPeriod > 0) clientMap.set(c.client, (clientMap.get(c.client) || 0) + revenueInPeriod);
    });
    return Array.from(clientMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  const topContractsRemaining = useMemo(() => {
    const contractMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let remainingInPeriod = 0;
      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange && pm.month >= startOfMonth(new Date())) remainingInPeriod += pm.value;
      });
      if (remainingInPeriod > 0) {
        contractMap.set(c.contractNo, (contractMap.get(c.contractNo) || 0) + remainingInPeriod);
      }
    });
    return Array.from(contractMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  const contractBalancesAsOf = useMemo(() => {
    const balances: { contract: ProcessedContract; balance: number }[] = [];
    const asOfDate = startDate ? startOfMonth(new Date(startDate)) : startOfMonth(new Date());

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let recognizedUpToDate = 0;
      c.proratedMonths.forEach(pm => {
        if (pm.month <= asOfDate) {
          recognizedUpToDate += pm.value;
        }
      });

      const balance = Math.max(0, c.totalValue - recognizedUpToDate);
      balances.push({ contract: c, balance });
    });

    return balances.sort((a, b) => b.balance - a.balance);
  }, [data, startDate, selectedClient, selectedContract, selectedDepartment]);

  const clientBalancesAsOf = useMemo(() => {
    const balances = new Map<string, number>();
    const asOfDate = startDate ? startOfMonth(new Date(startDate)) : startOfMonth(new Date());

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let recognizedUpToDate = 0;
      c.proratedMonths.forEach(pm => {
        if (pm.month <= asOfDate) {
          recognizedUpToDate += pm.value;
        }
      });

      const balance = Math.max(0, c.totalValue - recognizedUpToDate);
      balances.set(c.client, (balances.get(c.client) || 0) + balance);
    });

    return Array.from(balances.entries())
      .map(([client, balance]) => ({ client, balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [data, startDate, selectedClient, selectedContract, selectedDepartment]);

  const availableMonths = useMemo(() => {
    const dates = new Set<string>();
    data.forEach(c => {
      c.proratedMonths.forEach(pm => dates.add(format(pm.month, 'yyyy-MM')));
    });
    return Array.from(dates).filter(d => parseInt(d.split('-')[0]) > 2019).sort();
  }, [data]);

  useEffect(() => {
    if (availableMonths.length > 0) {
      const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
      if (!startDate) {
        const initialStart = availableMonths.includes(lastMonth) ? lastMonth : availableMonths[0];
        setStartDate(initialStart);
      }
      if (!endDate) setEndDate(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, startDate, endDate]);

  const departmentMetrics = useMemo(() => {
    const deptMap = new Map<string, number>();
    const start = startDate ? startOfMonth(new Date(startDate)) : null;
    const end = endDate ? startOfMonth(new Date(endDate)) : null;

    data.forEach(c => {
      if (selectedClient !== 'All' && c.client !== selectedClient) return;
      if (selectedContract !== 'All' && c.contractNo !== selectedContract) return;
      if (selectedDepartment !== 'All' && c.department !== selectedDepartment) return;

      let revenueInPeriod = 0;
      c.proratedMonths.forEach(pm => {
        const isInRange = (!start || pm.month >= start) && (!end || pm.month <= end);
        if (isInRange) revenueInPeriod += pm.value;
      });
      
      deptMap.set(c.department, (deptMap.get(c.department) || 0) + revenueInPeriod);
    });
    return deptMap;
  }, [data, startDate, endDate, selectedClient, selectedContract, selectedDepartment]);

  return (
    <div className="min-h-screen text-white selection:bg-copper selection:text-obsidian">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#8B4000_0%,#050505_100%)] -z-10" />
      <div className="noise-bg" />
      
      {/* Top Navigation / Status Bar */}
      <nav className="border-b border-white/10 bg-[#121626]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-8">
          {/* Top Row */}
          <div className="h-16 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 mr-4">
                <button 
                  onClick={() => onNavigate('preview')} 
                  className="px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Preview Excel File
                </button>
                <button 
                  onClick={() => onNavigate('dashboard')} 
                  className="px-4 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-2 bg-copper text-obsidian shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <h1 className="font-sans font-semibold text-lg tracking-tight uppercase">Contract Analysis Dashboard <span className="text-gray-600 font-mono not-italic text-[10px] ml-3 uppercase tracking-widest opacity-50">v2.0.4</span></h1>
            </div>
            
            <div className="flex items-center gap-8">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
              <div className="flex items-center gap-4">
                <img 
                  src="https://iili.io/qVKkIEu.png" 
                  alt="Logo" 
                  className="h-16 w-auto object-contain brightness-110 contrast-125"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="py-4 grid grid-cols-2 md:grid-cols-5 gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">From</label>
              <div className="relative space-y-1">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search month..."
                    value={startDateSearch}
                    onChange={(e) => setStartDateSearch(e.target.value)}
                    onFocus={() => setActiveSearchField('startDate')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono focus:ring-0 focus:border-copper transition-colors p-0 pb-1 placeholder:text-gray-700"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-600 pointer-events-none" />
                  
                  {activeSearchField === 'startDate' && startDateSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121626]/95 backdrop-blur-xl border border-white/10 rounded shadow-2xl z-[60] max-h-40 overflow-y-auto">
                      {availableMonths.filter(m => {
                        const date = new Date(m);
                        const search = startDateSearch.toLowerCase();
                        return format(date, 'MMM yyyy').toLowerCase().includes(search) || 
                               format(date, 'MMMM yyyy').toLowerCase().includes(search);
                      }).slice(0, 5).map(m => (
                        <button
                          key={m}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                          onClick={() => {
                            setStartDate(m);
                            setStartDateSearch('');
                          }}
                        >
                          {format(new Date(m), 'MMM yyyy')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-sans font-medium focus:ring-0 cursor-pointer appearance-none p-0"
                  >
                    <option value="" className="bg-[#121626]">Start</option>
                    {availableMonths.map(m => <option key={m} value={m} className="bg-[#121626]">{format(new Date(m), 'MMM yyyy')}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-copper pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">To</label>
              <div className="relative space-y-1">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search month..."
                    value={endDateSearch}
                    onChange={(e) => setEndDateSearch(e.target.value)}
                    onFocus={() => setActiveSearchField('endDate')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono focus:ring-0 focus:border-copper transition-colors p-0 pb-1 placeholder:text-gray-700"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-600 pointer-events-none" />
                  
                  {activeSearchField === 'endDate' && endDateSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121626]/95 backdrop-blur-xl border border-white/10 rounded shadow-2xl z-[60] max-h-40 overflow-y-auto">
                      {availableMonths.filter(m => {
                        const date = new Date(m);
                        const search = endDateSearch.toLowerCase();
                        return format(date, 'MMM yyyy').toLowerCase().includes(search) || 
                               format(date, 'MMMM yyyy').toLowerCase().includes(search);
                      }).slice(0, 5).map(m => (
                        <button
                          key={m}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                          onClick={() => {
                            setEndDate(m);
                            setEndDateSearch('');
                          }}
                        >
                          {format(new Date(m), 'MMM yyyy')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-sans font-medium focus:ring-0 cursor-pointer appearance-none p-0"
                  >
                    <option value="" className="bg-[#121626]">End</option>
                    {availableMonths.map(m => <option key={m} value={m} className="bg-[#121626]">{format(new Date(m), 'MMM yyyy')}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-copper pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Client</label>
              <div className="relative space-y-1">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search client..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onFocus={() => setActiveSearchField('client')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono focus:ring-0 focus:border-copper transition-colors p-0 pb-1 placeholder:text-gray-700"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-600 pointer-events-none" />
                  
                  {activeSearchField === 'client' && clientSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121626]/95 backdrop-blur-xl border border-white/10 rounded shadow-2xl z-[60] max-h-40 overflow-y-auto">
                      {clients.filter(c => c !== 'All').slice(0, 5).map(c => (
                        <button
                          key={c}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch('');
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={selectedClient} 
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-sans font-medium focus:ring-0 cursor-pointer appearance-none p-0"
                  >
                    {clients.map(c => <option key={c} value={c} className="bg-[#121626]">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-copper pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Contract</label>
              <div className="relative space-y-1">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search contract..."
                    value={contractSearch}
                    onChange={(e) => setContractSearch(e.target.value)}
                    onFocus={() => setActiveSearchField('contract')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono focus:ring-0 focus:border-copper transition-colors p-0 pb-1 placeholder:text-gray-700"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-600 pointer-events-none" />

                  {activeSearchField === 'contract' && contractSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121626]/95 backdrop-blur-xl border border-white/10 rounded shadow-2xl z-[60] max-h-40 overflow-y-auto">
                      {contractOptions.filter(c => c !== 'All').slice(0, 5).map(c => (
                        <button
                          key={c}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                          onClick={() => {
                            setSelectedContract(c);
                            setContractSearch('');
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={selectedContract} 
                    onChange={(e) => setSelectedContract(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-sans font-medium focus:ring-0 cursor-pointer appearance-none p-0"
                  >
                    {contractOptions.map(c => <option key={c} value={c} className="bg-[#121626]">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-copper pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[8px] uppercase tracking-widest text-gray-500">Department</label>
              <div className="relative space-y-1">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search dept..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    onFocus={() => setActiveSearchField('dept')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono focus:ring-0 focus:border-copper transition-colors p-0 pb-1 placeholder:text-gray-700"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-600 pointer-events-none" />

                  {activeSearchField === 'dept' && deptSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121626]/95 backdrop-blur-xl border border-white/10 rounded shadow-2xl z-[60] max-h-40 overflow-y-auto">
                      {departments.filter(d => d !== 'All').slice(0, 5).map(d => (
                        <button
                          key={d}
                          className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-copper hover:text-obsidian transition-colors truncate"
                          onClick={() => {
                            setSelectedDepartment(d);
                            setDeptSearch('');
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={selectedDepartment} 
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-sans font-medium focus:ring-0 cursor-pointer appearance-none p-0"
                  >
                    {departments.map(d => <option key={d} value={d} className="bg-[#121626]">{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 text-copper pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8 space-y-8 relative">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Contract Value', value: metrics.totalContractValue, icon: FileText, suffix: 'QAR' },
            { label: 'Remaining Balance', value: metrics.totalRemainingBalance, icon: TrendingUp, suffix: 'QAR', highlight: true },
            { label: 'Active Contracts', value: metrics.activeContractsCount, icon: Users, suffix: 'Units' }
          ].map((kpi, i) => (
            <motion.div 
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group relative"
            >
              <div className="laser-beam" style={{ animationDelay: `${i * 2}s` }} />
              <div className="refractive-highlight" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.highlight ? 'text-copper' : 'text-gray-500'}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-3xl font-sans font-semibold tracking-tight ${kpi.highlight ? 'text-copper' : 'text-white'}`}>
                    {typeof kpi.value === 'number' ? formatCurrency(kpi.value) : kpi.value}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{kpi.suffix} // Verified</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-px bg-copper/20 w-0 group-hover:w-full transition-all duration-700" />
            </motion.div>
          ))}
        </div>

        {/* Main Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Revenue Trajectory */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-12 glass-card p-8 flex flex-col min-h-[500px] hover:border-white/40 transition-colors duration-500 relative"
          >
            <div className="laser-beam" style={{ animationDelay: '1s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif italic">Revenue Trajectory</h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Prorated Forecast // Aggregate</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewType('monthly')}
                    className={`w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-mono transition-colors ${viewType === 'monthly' ? 'bg-copper text-obsidian' : 'text-gray-500 hover:bg-white/5'}`}
                  >
                    M
                  </button>
                  <button 
                    onClick={() => setViewType('yearly')}
                    className={`w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-mono transition-colors ${viewType === 'yearly' ? 'bg-copper text-obsidian' : 'text-gray-500 hover:bg-white/5'}`}
                  >
                    Y
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.1)" 
                      tick={{fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono'}} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.1)" 
                      tick={{fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono'}} 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#D97706', strokeWidth: 1 }} />
                    <Line 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="#D97706" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#D97706', strokeWidth: 0 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Contract Balances Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-12 glass-card p-8 flex flex-col hover:border-white/40 transition-colors duration-500 relative"
          >
            <div className="laser-beam" style={{ animationDelay: '2s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-sans font-semibold">Contract Running Balance</h3>
                </div>
                <button 
                  onClick={() => setIsContractsExpanded(!isContractsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-copper">
                    {isContractsExpanded ? 'Collapse View' : 'Expand View'}
                  </span>
                  {isContractsExpanded ? <Minimize2 className="w-4 h-4 text-copper" /> : <Maximize2 className="w-4 h-4 text-copper" />}
                </button>
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ${isContractsExpanded ? 'max-h-[2000px]' : 'max-h-[500px]'}`}>
                <div className="overflow-y-auto max-h-[500px] scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#121626] z-10">
                      <tr className="border-b border-white/5">
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500 w-16">#</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500">Contract ID</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500">Client</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500 text-right">Total Value</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500 text-right">Balance As Of</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractBalancesAsOf
                        .slice(0, isContractsExpanded ? undefined : 10)
                        .map((item, idx) => (
                          <tr key={item.contract.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-gray-600">{idx + 1}</td>
                            <td className="p-4 font-mono text-xs">{item.contract.contractNo}</td>
                            <td className="p-4 font-sans text-sm">{item.contract.client}</td>
                            <td className="p-4 font-mono text-sm text-right">{formatCurrency(item.contract.totalValue)}</td>
                            <td className="p-4 font-mono text-sm text-right text-copper">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!isContractsExpanded && contractBalancesAsOf.length > 10 && (
                  <div className="pt-4 text-center">
                    <button 
                      onClick={() => setIsContractsExpanded(true)}
                      className="font-mono text-[10px] uppercase tracking-widest text-copper hover:text-white transition-colors"
                    >
                      View All {contractBalancesAsOf.length} Contracts
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Running Balance Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-12 glass-card p-8 min-h-[450px] flex flex-col hover:border-white/40 transition-colors duration-500 relative"
          >
            <div className="laser-beam" style={{ animationDelay: '3s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-sans font-semibold">Running Balance</h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Cumulative Portfolio Outstanding // Time Series</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewType('monthly')}
                    className={`w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-mono transition-colors ${viewType === 'monthly' ? 'bg-copper text-obsidian' : 'text-gray-500 hover:bg-white/5'}`}
                  >
                    M
                  </button>
                  <button 
                    onClick={() => setViewType('yearly')}
                    className={`w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-mono transition-colors ${viewType === 'yearly' ? 'bg-copper text-obsidian' : 'text-gray-500 hover:bg-white/5'}`}
                  >
                    Y
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] overflow-x-auto scrollbar-thin scrollbar-thumb-copper/20 scrollbar-track-transparent">
                <div style={{ 
                  minWidth: viewType === 'monthly' ? Math.max(800, runningBalanceData.length * 60) : '100%', 
                  height: '100%',
                  minHeight: '350px'
                }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={runningBalanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.1)" 
                        tick={{fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono'}} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.1)" 
                        tick={{fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono'}} 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        axisLine={false}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#D97706', strokeWidth: 1 }} />
                      <Line 
                        type="monotone" 
                        dataKey="Balance" 
                        stroke="#D97706" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#D97706', strokeWidth: 0 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Client Balances Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-12 glass-card p-8 flex flex-col hover:border-white/40 transition-colors duration-500 relative"
          >
            <div className="laser-beam" style={{ animationDelay: '4s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-sans font-semibold">Client Balances</h3>
                </div>
                <button 
                  onClick={() => setIsClientsExpanded(!isClientsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-copper">
                    {isClientsExpanded ? 'Collapse View' : 'Expand View'}
                  </span>
                  {isClientsExpanded ? <Minimize2 className="w-4 h-4 text-copper" /> : <Maximize2 className="w-4 h-4 text-copper" />}
                </button>
              </div>

              <div className="mb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientBalancesAsOf.filter(item => item.balance > 0).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="client" 
                      stroke="rgba(255,255,255,0.1)" 
                      tick={{fill: '#9ca3af', fontSize: 8, fontFamily: 'JetBrains Mono'}} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.1)" 
                      tick={{fill: '#9ca3af', fontSize: 9, fontFamily: 'JetBrains Mono'}} 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="balance" fill="#D97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ${isClientsExpanded ? 'max-h-[2000px]' : 'max-h-[500px]'}`}>
                <div className="overflow-y-auto max-h-[500px] scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#121626] z-10">
                      <tr className="border-b border-white/5">
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500 w-16">#</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500">Client Entity</th>
                        <th className="p-4 font-mono text-[10px] uppercase text-gray-500 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBalancesAsOf
                        .filter(item => item.balance > 0)
                        .slice(0, isClientsExpanded ? undefined : 10)
                        .map((item, i) => (
                          <tr key={item.client} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-gray-600">{i + 1}</td>
                            <td className="p-4 font-sans text-sm">{item.client}</td>
                            <td className="p-4 font-mono text-sm text-right text-copper">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!isClientsExpanded && clientBalancesAsOf.filter(item => item.balance > 0).length > 10 && (
                  <div className="pt-4 text-center">
                    <button 
                      onClick={() => setIsClientsExpanded(true)}
                      className="font-mono text-[10px] uppercase tracking-widest text-copper hover:text-white transition-colors"
                    >
                      View All {clientBalancesAsOf.filter(item => item.balance > 0).length} Clients
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Department Dashboard */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-12 glass-card p-8 min-h-[300px] flex flex-col hover:border-white/40 transition-colors duration-500 relative"
          >
            <div className="laser-beam" style={{ animationDelay: '5s' }} />
            <div className="refractive-highlight" />
            <div className="relative z-10">
              <h3 className="text-xl font-sans font-semibold mb-8">Department Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['VSS', 'TSS', 'NDT', 'TPI'].map((dept, i) => (
                  <motion.div 
                    key={dept}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    className="p-6 border border-white/20 bg-white/5 transition-all glass-card relative overflow-hidden"
                  >
                    <div className="laser-beam opacity-20" style={{ animationDelay: `${i * 0.5}s`, animationDuration: '4s' }} />
                    <div className="refractive-highlight opacity-10" />
                    <div className="relative z-10">
                      <p className="font-mono text-[10px] text-gray-400 uppercase mb-2">{dept}</p>
                      <p className="text-2xl font-sans font-semibold text-white">
                        {formatCurrency(departmentMetrics.get(dept) || 0)} <span className="text-xs font-normal text-gray-400">QAR</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="border-t border-white/5 py-12 px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <p className="font-serif italic text-2xl">Financial Core Intelligence</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gray-600">Precision Forecasting Protocol // © 2026</p>
          </div>
          <div className="flex gap-12 font-mono text-[9px] uppercase tracking-widest text-gray-500">
            <div className="space-y-1">
              <p className="text-copper">Location</p>
              <p>Doha // Qatar</p>
            </div>
            <div className="space-y-1">
              <p className="text-copper">Encryption</p>
              <p>AES-256 // Active</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

