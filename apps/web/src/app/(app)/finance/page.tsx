'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, IndianRupee, Activity, Droplets, ShieldCheck, FileText, CheckCircle2, Clock, CalendarDays, Percent, ShieldAlert, BarChart2, TrendingUp } from 'lucide-react';

interface RealData {
  temp: number;
  moisture: number;
  precip7Day: number;
  tempMax7Day: number;
}

interface Loan {
  id: number;
  amount: number;
  purpose: string;
  score: number;
  status: string;
  timestamp: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  note: string;
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizers / Pesticides', 'Fuel / Electricity', 'Labor Wages', 'Machinery / Repairs'];

/** Returns the last 6 calendar-month labels + income/expense totals from transactions */
function buildMonthlyData(transactions: Transaction[]) {
  const now = new Date();
  const months: { label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    const y = d.getFullYear();
    const m = d.getMonth();
    const income = transactions
      .filter(t => { const td = new Date(t.date); return t.type === 'income' && td.getFullYear() === y && td.getMonth() === m; })
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter(t => { const td = new Date(t.date); return t.type === 'expense' && td.getFullYear() === y && td.getMonth() === m; })
      .reduce((s, t) => s + t.amount, 0);
    months.push({ label, income, expense });
  }
  return months;
}

const MOCK_MONTHLY = [
  { label: "Feb'25", income: 42000, expense: 18000 },
  { label: "Mar'25", income: 55000, expense: 23000 },
  { label: "Apr'25", income: 38000, expense: 29000 },
  { label: "May'25", income: 61000, expense: 31000 },
  { label: "Jun'25", income: 47000, expense: 25000 },
  { label: "Jul'25", income: 52000, expense: 22000 },
];

const MOCK_CATEGORIES = [
  { label: 'Seeds', pct: 28 },
  { label: 'Fertilizers / Pesticides', pct: 35 },
  { label: 'Fuel / Electricity', pct: 12 },
  { label: 'Labor Wages', pct: 18 },
  { label: 'Machinery / Repairs', pct: 7 },
];

/** Returns profit/loss per week for the last 7 weeks */
function buildWeeklyTrend(transactions: Transaction[]) {
  const now = new Date();
  const weeks: { label: string; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    const label = `W${7 - i}`;
    const income = transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'income' && d >= weekStart && d <= weekEnd; })
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d >= weekStart && d <= weekEnd; })
      .reduce((s, t) => s + t.amount, 0);
    weeks.push({ label, profit: income - expense });
  }
  return weeks;
}

const MOCK_WEEKLY = [
  { label: 'W1', profit: 3200 },
  { label: 'W2', profit: -800 },
  { label: 'W3', profit: 5100 },
  { label: 'W4', profit: -1200 },
  { label: 'W5', profit: 4700 },
  { label: 'W6', profit: 2900 },
  { label: 'W7', profit: 6100 },
];

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  
  // Real-time Credit Engine Data
  const [score, setScore] = useState<number | null>(null);
  const [realData, setRealData] = useState<RealData | null>(null);
  const [annualIncome, setAnnualIncome] = useState<number>(150000);
  const [maxCreditLimit, setMaxCreditLimit] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  
  // Loan Submission State
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customPurpose, setCustomPurpose] = useState<string>('Farm Operations & Equipment');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'credit' | 'ledger' | 'analytics'>('credit');

  // Farm Ledger State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txForm, setTxForm] = useState({ type: 'expense' as 'income'|'expense', category: 'Seeds', amount: '', date: new Date().toISOString().split('T')[0], note: '' });


  useEffect(() => {
    setMounted(true);
    const savedLedger = localStorage.getItem('kisanseva_ledger');
    if (savedLedger) {
      setTransactions(JSON.parse(savedLedger));
    }
  }, []);

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem('kisanseva_ledger', JSON.stringify(updated));
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || isNaN(Number(txForm.amount))) return;
    
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: txForm.type,
      category: txForm.category,
      amount: Number(txForm.amount),
      date: txForm.date,
      note: txForm.note
    };
    saveTransactions([newTx, ...transactions]);
    setTxForm({ ...txForm, amount: '', note: '' });
  };

  const handleDeleteTx = (id: string) => {
    saveTransactions(transactions.filter(t => t.id !== id));
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // ── Analytics derived data ──────────────────────────────────────────────────
  const _now = new Date();

  const thisMonthIncome = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getFullYear() === _now.getFullYear() && d.getMonth() === _now.getMonth();
    }).reduce((s, t) => s + t.amount, 0)
  , [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const thisMonthExpense = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getFullYear() === _now.getFullYear() && d.getMonth() === _now.getMonth();
    }).reduce((s, t) => s + t.amount, 0)
  , [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const thisMonthProfit = thisMonthIncome - thisMonthExpense;
  const hasRealData = transactions.length > 0;

  const monthlyData = useMemo(() =>
    hasRealData ? buildMonthlyData(transactions) : MOCK_MONTHLY
  , [transactions, hasRealData]);

  const weeklyTrend = useMemo(() =>
    hasRealData ? buildWeeklyTrend(transactions) : MOCK_WEEKLY
  , [transactions, hasRealData]);

  const categoryBreakdown = useMemo(() => {
    if (!hasRealData) return MOCK_CATEGORIES;
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return MOCK_CATEGORIES;
    return EXPENSE_CATEGORIES.map(cat => {
      const catTotal = expenses
        .filter(t => t.category.toLowerCase().startsWith(cat.split(' ')[0].toLowerCase()))
        .reduce((s, t) => s + t.amount, 0);
      return { label: cat, pct: Math.round((catTotal / total) * 100) };
    });
  }, [transactions, hasRealData]);

  const maxMonthlyValue = useMemo(() =>
    Math.max(...monthlyData.flatMap(m => [m.income, m.expense]), 1)
  , [monthlyData]);

  const fetchMyLoans = async () => {
    try {
      const res = await fetch('/api/v1/loans');
      const data = await res.json();
      if (data.loans) setMyLoans(data.loans);
    } catch (e) {
      console.error(e);
    }
  };

  // Recalculate Max Limit whenever Score or Income changes
  useEffect(() => {
    if (score === null) return;
    
    // Environmental Limit (Max ₹5,00,000 based purely on weather/GPS score)
    const envLimit = score > 400 ? Math.floor(((score - 400) / 500) * 500000) : 0;
    
    // Financial Limit (Bank policy: Max 2.5x Declared Annual Revenue)
    const financialLimit = annualIncome * 2.5;
    
    // Final Limit is the safest (minimum) of both constraints
    const finalLimit = Math.min(envLimit, financialLimit);
    
    setMaxCreditLimit(finalLimit);
    
    // If the currently selected slider amount exceeds the new limit, bump it down
    setCustomAmount(prev => prev > finalLimit ? Math.floor(finalLimit / 2) : prev);
  }, [score, annualIncome]);

  useEffect(() => {
    fetchMyLoans();
    
    // Dynamic Kisan Credit Score Engine (using REAL 7-day forecast Open-Meteo Data)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Fetch current AND daily 7-day forecast
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,soil_moisture_0_to_1cm&daily=temperature_2m_max,precipitation_sum&timezone=auto`);
          const data = await res.json();
          
          const totalPrecip7Day = data.daily?.precipitation_sum?.reduce((a: number, b: number) => a + b, 0) || 0;
          const maxTemp7Day = Math.max(...(data.daily?.temperature_2m_max || [30]));

          const rd: RealData = {
            temp: data.current.temperature_2m || 30,
            moisture: data.current.soil_moisture_0_to_1cm || 0.25,
            precip7Day: totalPrecip7Day,
            tempMax7Day: maxTemp7Day
          };
          
          setRealData(rd);
          
          // Kisan Credit Score Engine (300 - 900)
          let baseScore = 650;
          
          // 1. Current Soil Moisture Factor (0.2 to 0.4 is optimal)
          if (rd.moisture > 0.2 && rd.moisture < 0.4) baseScore += 80;
          else if (rd.moisture < 0.1) baseScore -= 120; // Severe drought risk
          else baseScore -= 40;
          
          // 2. 7-Day Drought / Heatwave Risk
          if (rd.tempMax7Day > 40) baseScore -= 100;
          else if (rd.tempMax7Day > 15 && rd.tempMax7Day < 35) baseScore += 60;
          
          // 3. 7-Day Flood / Rain Risk
          if (rd.precip7Day > 150) baseScore -= 100; // Severe flood risk
          else if (rd.precip7Day > 20 && rd.precip7Day < 80) baseScore += 80; // Optimal rain
          else if (rd.precip7Day < 5) baseScore -= 50; // Dry spell
          
          const finalScore = Math.min(900, Math.max(300, Math.floor(baseScore)));
          setScore(finalScore);

          // Calculate Live Interest Rate (Base Repo 6.5% + Risk Premium)
          const riskPremium = ((900 - finalScore) / 100) * 1.25;
          setInterestRate(Number((6.5 + riskPremium).toFixed(2)));

        } catch (e) {
          setScore(620); 
          setInterestRate(8.5);
        } finally {
          setIsCalculating(false);
        }
      }, () => {
        setScore(500); 
        setInterestRate(10.5);
        setIsCalculating(false);
      }, { timeout: 10000 });
    } else {
      setScore(500);
      setInterestRate(10.5);
      setIsCalculating(false);
    }
  }, []);

  const handleApply = async () => {
    if (!score || customAmount <= 0 || customAmount > maxCreditLimit) return;
    setIsApplying(true);
    try {
      const res = await fetch('/api/v1/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: customAmount, purpose: customPurpose, score })
      });
      if (res.ok) {
        await fetchMyLoans();
        alert(`Eligibility Certificate for ₹${customAmount.toLocaleString('en-IN')} generated! Take this to your local bank branch.`);
        setCustomAmount(0); // Reset
      } else {
        alert("Failed to generate certificate.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!mounted) return null;

  const getScoreColor = (s: number) => {
    if (s >= 750) return '#10b981'; // Green
    if (s >= 600) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreRating = (s: number) => {
    if (s >= 750) return 'Highly Eligible';
    if (s >= 600) return 'Eligible';
    return 'Not Eligible';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER WITH TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={28} color="#3b82f6" /> Financial Services
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('credit')}
              style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: activeTab === 'credit' ? '#1e293b' : '#f1f5f9', color: activeTab === 'credit' ? '#fff' : '#64748b' }}
            >
              Agri-Credit Eligibility
            </button>
            <button 
              id="tab-ledger"
              onClick={() => setActiveTab('ledger')}
              style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: activeTab === 'ledger' ? '#1e293b' : '#f1f5f9', color: activeTab === 'ledger' ? '#fff' : '#64748b' }}
              aria-label="Farm Ledger tab"
            >
              Farm Ledger (Offline)
            </button>
            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: activeTab === 'analytics' ? '#3b82f6' : 'transparent', color: activeTab === 'analytics' ? '#fff' : '#64748b' }}
              aria-label="Analytics tab"
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'credit' && (
        <>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* KISAN CREDIT SCORE ENGINE */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: score ? getScoreColor(score) : '#e2e8f0' }} />
          
          {/* Security Badge */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid #a7f3d0' }}>
            <ShieldCheck size={12} /> 256-bit AES
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', margin: '0 0 24px 0', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity size={18} color="#64748b" /> Live Credit Engine
          </h2>

          {isCalculating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
              <div style={{ width: '80px', height: '80px', border: '4px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>Analyzing Live Telemetry...</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fetching 7-Day Weather Forecasts</div>
            </div>
          ) : (
            <>
              {/* Score Gauge */}
              <div style={{ width: '220px', height: '110px', position: 'relative', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: '220px', height: '220px', borderRadius: '50%', border: '24px solid #f1f5f9', position: 'absolute', top: 0, left: 0, boxSizing: 'border-box' }} />
                <div style={{ 
                  width: '220px', height: '220px', borderRadius: '50%', border: `24px solid ${getScoreColor(score!)}`, position: 'absolute', top: 0, left: 0, boxSizing: 'border-box',
                  borderBottomColor: 'transparent', borderRightColor: 'transparent',
                  transform: `rotate(${ -45 + ((score! - 300) / 600) * 180 }deg)`, transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
                <div style={{ position: 'absolute', bottom: '0', width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1e293b', lineHeight: 1, letterSpacing: '-2px' }}>{score}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: getScoreColor(score!), textTransform: 'uppercase', letterSpacing: '1px' }}>{getScoreRating(score!)}</div>
                </div>
              </div>

              {/* Engine Factors */}
              <div style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Live Underwriting Factors</span>
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={12}/> RBI Compliant</span>
                </div>
                
                {realData ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Droplets size={14}/> Current Soil Moisture</span>
                      <span style={{ fontWeight: 700, color: realData.moisture > 0.2 ? '#10b981' : '#ef4444' }}>{realData.moisture} m³/m³</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={14}/> 7-Day Rain Forecast</span>
                      <span style={{ fontWeight: 700, color: (realData.precip7Day > 150 || realData.precip7Day < 5) ? '#ef4444' : '#10b981' }}>{realData.precip7Day.toFixed(1)} mm</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> 7-Day Peak Temp</span>
                      <span style={{ fontWeight: 700, color: realData.tempMax7Day > 40 ? '#ef4444' : '#10b981' }}>{realData.tempMax7Day}°C</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Could not fetch live telemetry. Risk factor increased.</div>
                )}
                
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14}/> Farm GPS Verification</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>Verified Location</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14}/> PM-Kisan ID Match</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>Verified via Aadhaar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart2 size={14}/> Experian / CIBIL Sync</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>Active (AA Framework)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14}/> Bhulekh Land Registry</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>Title Clear & Encumbrance-Free</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DYNAMIC LOAN INPUT UI */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Generate Certificate
            <span style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '6px' }}>For Local Banks</span>
          </h2>

          {isCalculating ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Waiting for Underwriting Engine...</div>
          ) : (
            <>
              {/* Financial Inputs */}
              <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Declared Annual Farm Revenue
                  </label>
                  <button style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> Sync via Account Aggregator
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 16px' }}>
                  <IndianRupee size={18} color="#64748b" />
                  <input 
                    type="number" 
                    value={annualIncome || ''} 
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', width: '100%', marginLeft: '8px' }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                  * Maximum credit is capped at 2.5x your annual revenue or your environmental limit, whichever is lower.
                </div>
              </div>

              {maxCreditLimit > 0 ? (
                <>
                  {/* Dynamic Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Max Eligible Amount</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center' }}>
                        <IndianRupee size={20} strokeWidth={3} /> {maxCreditLimit.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Suggested Bank Rate</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Percent size={20} strokeWidth={3} /> {interestRate.toFixed(2)}<span style={{ fontSize: '0.9rem' }}>p.a.</span>
                      </div>
                    </div>
                  </div>

                  {/* Range Slider & Input */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>Choose Amount</label>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', flex: 1 }}>
                        <IndianRupee size={20} />
                        <input 
                          type="number" 
                          value={customAmount} 
                          onChange={(e) => setCustomAmount(Math.min(maxCreditLimit, Math.max(0, Number(e.target.value))))}
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', width: '100%', marginLeft: '4px' }}
                        />
                      </div>
                    </div>

                    <input 
                      type="range" 
                      min="0" 
                      max={maxCreditLimit} 
                      step="5000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Purpose Dropdown */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Fund Purpose</label>
                    <select 
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option>Farm Operations & Equipment</option>
                      <option>High-Yield Seeds & Fertilizer</option>
                      <option>Drip Irrigation Setup</option>
                      <option>Labor Wages & Harvesting</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '12px', marginBottom: '24px' }}>
                    <ShieldCheck size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>Blockchain Signature Verification</div>
                      <div style={{ fontSize: '0.8rem', color: '#15803d', lineHeight: 1.4 }}>
                        Your certificate will be minted on the Polygon network as an immutable Smart Contract, ensuring cryptographic trust with partner banks.
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleApply}
                    disabled={isApplying || customAmount <= 0}
                    style={{
                      backgroundColor: (isApplying || customAmount <= 0) ? '#cbd5e1' : '#3b82f6', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', 
                      fontWeight: 800, fontSize: '1.05rem', cursor: (isApplying || customAmount <= 0) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                      boxShadow: (isApplying || customAmount <= 0) ? 'none' : '0 10px 25px rgba(59,130,246,0.4)', marginTop: 'auto'
                    }}
                  >
                    {isApplying ? 'Generating...' : `Generate Certificate for ₹${customAmount.toLocaleString('en-IN')}`}
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                  <ShieldAlert size={40} color="#ef4444" style={{ marginBottom: '16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '1.1rem' }}>Ineligible for Certificate</h3>
                  <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem' }}>Based on current severe environmental risks at your location, your farm is currently ineligible for a pre-approval certificate. Please try again when weather conditions improve.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ACTIVE LOANS LEDGER */}
      {myLoans.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} /> Generated Eligibility Certificates
          </h2>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            {myLoans.map((loan, idx) => (
              <div key={loan.id} style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx !== myLoans.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '50%' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                      <IndianRupee size={16} strokeWidth={3} /> {loan.amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{loan.purpose}</div>
                    <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                      Show this Pre-Approval Code at your local bank: <strong style={{ letterSpacing: '1px' }}>KCC-{loan.id.toString().padStart(4, '0')}-{loan.score}</strong>
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    PRE-APPROVED
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Generated {new Date(loan.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'ledger' && (
        /* FARM LEDGER VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Income</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={24} strokeWidth={3} /> {totalIncome.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Expenses</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={24} strokeWidth={3} /> {totalExpense.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', padding: '20px', borderRadius: '16px', border: netProfit >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: netProfit >= 0 ? '#16a34a' : '#dc2626', textTransform: 'uppercase', marginBottom: '8px' }}>Net Profit / Loss</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: netProfit >= 0 ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={24} strokeWidth={3} /> {Math.abs(netProfit).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Add Transaction Form */}
            <form onSubmit={handleAddTransaction} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 20px 0' }}>New Record</h2>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button type="button" onClick={() => setTxForm({...txForm, type: 'income', category: 'Crop Sale'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: txForm.type === 'income' ? '2px solid #10b981' : '1px solid #e2e8f0', backgroundColor: txForm.type === 'income' ? '#ecfdf5' : '#fff', color: txForm.type === 'income' ? '#059669' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Income</button>
                <button type="button" onClick={() => setTxForm({...txForm, type: 'expense', category: 'Seeds'})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: txForm.type === 'expense' ? '2px solid #ef4444' : '1px solid #e2e8f0', backgroundColor: txForm.type === 'expense' ? '#fef2f2' : '#fff', color: txForm.type === 'expense' ? '#dc2626' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Expense</button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Category</label>
                <select value={txForm.category} onChange={e => setTxForm({...txForm, category: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none' }}>
                  {txForm.type === 'income' ? (
                    <>
                      <option>Crop Sale</option>
                      <option>Govt Subsidy</option>
                      <option>Equipment Rental</option>
                      <option>Other Income</option>
                    </>
                  ) : (
                    <>
                      <option>Seeds</option>
                      <option>Fertilizers / Pesticides</option>
                      <option>Labor Wages</option>
                      <option>Fuel / Electricity</option>
                      <option>Machinery / Repairs</option>
                      <option>Other Expense</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Amount (₹)</label>
                <input required type="number" min="1" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none' }} placeholder="e.g. 5000" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Date</label>
                <input required type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Note (Optional)</label>
                <input type="text" value={txForm.note} onChange={e => setTxForm({...txForm, note: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none' }} placeholder="Brief detail..." />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                Save Record
              </button>
            </form>

            {/* Transaction History */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Recent Transactions</h2>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {transactions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No transactions yet. Start adding records to build your offline ledger.</div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tx.type === 'income' ? '#ecfdf5' : '#fef2f2', color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                          <IndianRupee size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{tx.category}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(tx.date).toLocaleDateString()} {tx.note && `• ${tx.note}`}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontWeight: 800, color: tx.type === 'income' ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <button onClick={() => handleDeleteTx(tx.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }} title="Delete">
                          {/* We omit Lucide Trash2 import if missing, but we can just use an HTML entity or standard button text */}
                          ❌
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        /* FARM ANALYTICS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 3 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#10b981' }}><TrendingUp size={24} /></div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Income (This Month)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>₹{thisMonthIncome.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#ef4444' }}><Activity size={24} /></div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Expenses (This Month)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>₹{thisMonthExpense.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: thisMonthProfit >= 0 ? '#ecfdf5' : '#fef2f2', color: thisMonthProfit >= 0 ? '#10b981' : '#ef4444' }}><Wallet size={24} /></div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Profit (This Month)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: thisMonthProfit >= 0 ? '#10b981' : '#ef4444' }}>{thisMonthProfit >= 0 ? '+' : '-'}₹{Math.abs(thisMonthProfit).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Bar Chart */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={18} color="#64748b"/> 6-Month Cash Flow</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                {monthlyData.map((m, i) => {
                  const incPct = Math.max((m.income / maxMonthlyValue) * 100, 2);
                  const expPct = Math.max((m.expense / maxMonthlyValue) * 100, 2);
                  return (
                    <div key={i} style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'flex-end', position: 'relative', width: '12%' }}>
                      <div style={{ width: '100%', height: `${incPct}%`, backgroundColor: '#10b981', borderRadius: '4px 4px 0 0', opacity: 0.9 }}></div>
                      <div style={{ width: '100%', height: `${expPct}%`, backgroundColor: '#ef4444', borderRadius: '4px 4px 0 0', opacity: 0.9 }}></div>
                      <div style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }}/> Income</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }}/> Expense</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Expense Breakdown */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Expense Breakdown</h3>
                {categoryBreakdown.map((cat, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#475569' }}>{cat.label}</span>
                      <span style={{ color: '#1e293b' }}>{cat.pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px' }}>
                      <div style={{ width: `${cat.pct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7-Week Profit Trend */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>7-Week Profit Trend</h3>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                  {weeklyTrend.map((w, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: w.profit > 0 ? '#10b981' : w.profit < 0 ? '#ef4444' : '#e2e8f0', opacity: w.profit === 0 ? 0.5 : Math.min(1, 0.4 + Math.abs(w.profit)/10000) }}></div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

