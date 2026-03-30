import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap, Activity, Calculator, Sparkles, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import LiveMatchCard from './LiveMatchCard';

type Strategy = 'Safe' | 'Balanced' | 'Aggressive' | 'Value';
type Tab = 'Input' | 'Strategy' | 'Results';
type AppMode = 'Optimizer' | 'Trader';

export default function App() {
  const [mode, setMode] = useState<AppMode>('Optimizer');
  const [total, setTotal] = useState(200);
  const [r1, setR1] = useState(1.9);
  const [r2, setR2] = useState(2.1);
  const [p1, setP1] = useState(0.5);
  const [strategy, setStrategy] = useState<Strategy>('Safe');
  const [activeTab, setActiveTab] = useState<Tab>('Input');

  const p2 = +(1 - p1).toFixed(2);

  const result = useMemo(() => {
    const ip1 = 1 / r1;
    const ip2 = 1 / r2;
    const p2_val = 1 - p1;
    const valueA = p1 > ip1;
    const valueB = p2_val > ip2;
    const edgeA = p1 - ip1;
    const edgeB = p2_val - ip2;
    const arbitrageDetected = (ip1 + ip2) < 1;

    let x = 0, y = 0, strategyUsed = strategy as string, riskLevel = 'Low';

    if (p1 === 1) {
      x = total; y = 0; strategyUsed = 'Certain Outcome (A)';
    } else if (p1 === 0) {
      x = 0; y = total; strategyUsed = 'Certain Outcome (B)';
    } else {
      if (strategy === 'Aggressive') {
        let f1 = ((p1 * (r1 + 1)) - 1) / r1;
        let f2 = ((p2_val * (r2 + 1)) - 1) / r2;
        f1 = Math.max(0, Math.min(f1, 0.5));
        f2 = Math.max(0, Math.min(f2, 0.5));
        x = (f1 * 0.5) * total;
        y = (f2 * 0.5) * total;
        strategyUsed = 'Kelly Optimization (Half-Kelly)';
        riskLevel = 'High';
      } else if (strategy === 'Safe' || (strategy === 'Value' && !valueA && !valueB)) {
        x = (total * r2) / (r1 + r2);
        y = (total * r1) / (r1 + r2);
        strategyUsed = arbitrageDetected ? 'Arbitrage Hedge' : 'Hedge (No Value)';
        riskLevel = 'Low';
      } else {
        if (valueA && !valueB) {
          x = Math.min(0.8, edgeA * 2) * total;
          y = total - x;
          strategyUsed = 'Single Value (Team A)';
          riskLevel = 'Medium';
        } else if (valueB && !valueA) {
          y = Math.min(0.8, edgeB * 2) * total;
          x = total - y;
          strategyUsed = 'Single Value (Team B)';
          riskLevel = 'Medium';
        } else if (valueA && valueB) {
          const ev1 = (p1 * r1) - 1;
          const ev2 = (p2_val * r2) - 1;
          const sumEv = ev1 + ev2;
          x = (ev1 / (sumEv || 1)) * total;
          y = (ev2 / (sumEv || 1)) * total;
          strategyUsed = 'Dual Value EV Normalization';
          riskLevel = 'High';
        } else {
          x = (total * r2) / (r1 + r2);
          y = (total * r1) / (r1 + r2);
          strategyUsed = 'Hedge Fallback';
          riskLevel = 'Low';
        }
      }
    }

    const applyRiskControl = (val: number, prob: number) => {
      if (val > total * 0.8 && prob <= 0.75) return total * 0.8;
      return val;
    };

    const xChecked = applyRiskControl(x, p1);
    const yChecked = applyRiskControl(y, p2_val);
    const currentTotal = xChecked + yChecked;
    if (currentTotal > total) {
      const scale = total / currentTotal;
      x = xChecked * scale;
      y = yChecked * scale;
    } else {
      x = xChecked;
      y = yChecked;
    }

    const profitA = (x * r1) - (x + y);
    const profitB = (y * r2) - (x + y);

    return { x, y, profitA, profitB, riskLevel, strategyUsed, valueDetected: valueA || valueB, arbitrageDetected };
  }, [total, r1, r2, p1, strategy]);

  const { x, y, profitA, profitB, riskLevel, strategyUsed, valueDetected, arbitrageDetected } = result;

  // --- TRADER PRO STATE & LOGIC ---
  interface Stake {
    id: string;
    team: 'A' | 'B';
    amount: number;
    odds: number;
    timestamp: number;
  }

  const [stakes, setStakes] = useState<Stake[]>([
    { id: '1', team: 'A', amount: 100, odds: 2.2, timestamp: Date.now() }
  ]);
  const [currentOddsA, setCurrentOddsA] = useState(1.9);
  const [currentOddsB, setCurrentOddsB] = useState(2.1);
  const [traderCapital, setTraderCapital] = useState(1000);
  const [predP1, setPredP1] = useState(0.61);
  const [traderAmount, setTraderAmount] = useState(50);

  const addStake = (team: 'A' | 'B') => {
    const newStake: Stake = {
      id: Math.random().toString(36).substr(2, 9),
      team,
      amount: traderAmount,
      odds: team === 'A' ? currentOddsA : currentOddsB,
      timestamp: Date.now()
    };
    setStakes([...stakes, newStake]);
  };

  const removeStake = (id: string) => {
    setStakes(stakes.filter(s => s.id !== id));
  };

  const updateStake = (id: string, field: keyof Stake, value: any) => {
    setStakes(stakes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const traderProResult = useMemo(() => {
    const totalA = stakes.filter(s => s.team === 'A').reduce((sum, s) => sum + s.amount, 0);
    const totalB = stakes.filter(s => s.team === 'B').reduce((sum, s) => sum + s.amount, 0);
    const returnA = stakes.filter(s => s.team === 'A').reduce((sum, s) => sum + (s.amount * s.odds), 0);
    const returnB = stakes.filter(s => s.team === 'B').reduce((sum, s) => sum + (s.amount * s.odds), 0);
    const totalInvested = totalA + totalB;
    const pA_val = returnA - totalInvested;
    const pB_val = returnB - totalInvested;

    const ipA = 1 / currentOddsA;
    const ipB = 1 / currentOddsB;

    const valueA = predP1 > ipA;
    const valueB = (1 - predP1) > ipB;

    let nextAction = "Hold";
    let suggestAmt = 0;
    let reason = "Maintaining current exposure.";
    let strategyTrader = "Entry";
    let riskTrader = "Low";

    if (stakes.length === 0) {
      nextAction = valueA ? "Add Bet A" : valueB ? "Add Bet B" : "Wait";
      suggestAmt = traderCapital * 0.3;
      reason = "Initial entry at detected value edge.";
    } else if (totalB === 0 && totalA > 0) {
      const fullHedge = returnA / currentOddsB;
      nextAction = "Partial Hedge (B)";
      suggestAmt = fullHedge * 0.4;
      reason = "Reducing exposure on Team A. Protect capital.";
      strategyTrader = "Hedge";
      riskTrader = "Medium";
    } else if (totalA === 0 && totalB > 0) {
      const fullHedge = returnB / currentOddsA;
      nextAction = "Partial Hedge (A)";
      suggestAmt = fullHedge * 0.4;
      reason = "Reducing exposure on Team B. Protect capital.";
      strategyTrader = "Hedge";
      riskTrader = "Medium";
    } else if (pA_val > 0 && pB_val > 0) {
      nextAction = "Hold";
      reason = "Profit locked on both outcomes (Arbitrage).";
      strategyTrader = "Arbitrage";
    } else {
      if (pA_val < 0) {
        nextAction = "Add Bet A (Balance)";
        suggestAmt = Math.abs(pA_val) / currentOddsA;
        reason = "Balancing profitability across sides.";
      } else if (pB_val < 0) {
        nextAction = "Add Bet B (Balance)";
        suggestAmt = Math.abs(pB_val) / currentOddsB;
        reason = "Balancing profitability across sides.";
      }
    }

    if (ipA + ipB < 1) {
      nextAction = "Full Hedge (Arbitrage)";
      reason = "Market mispricing detected. Immediate profit lock!";
      strategyTrader = "Arbitrage";
    }

    if (totalInvested > traderCapital * 0.8) riskTrader = "High";

    return { totalInvested, pA: pA_val, pB: pB_val, nextAction, suggestAmt, reason, strategy: strategyTrader, risk: riskTrader };
  }, [stakes, currentOddsA, currentOddsB, traderCapital, predP1]);

  const chartData = [
    { name: `Team A (${r1})`, profit: +profitA.toFixed(2), color: profitA >= 0 ? '#22c55e' : '#ef4444' },
    { name: `Team B (${r2})`, profit: +profitB.toFixed(2), color: profitB >= 0 ? '#22c55e' : '#ef4444' }
  ];

  const risk = {
    level: riskLevel,
    color: riskLevel === 'Low' ? 'text-green-500' : riskLevel === 'Medium' ? 'text-yellow-500' : riskLevel === 'High' ? 'text-red-500' : 'text-purple-500',
    bg: riskLevel === 'Low' ? 'bg-green-500/20' : riskLevel === 'Medium' ? 'bg-yellow-500/20' : riskLevel === 'High' ? 'bg-red-500/20' : 'bg-purple-500/20'
  };

  const tabVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.1 } },
  };

  const renderHeader = ({ className = "" }: { className?: string }) => (
    <nav className={`border-b border-white/5 bg-zinc-900/60 backdrop-blur-md shrink-0 relative z-30 ${className}`}>
      <div className="px-2.5 h-12 lg:h-14 flex items-center justify-between gap-1 lg:gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 lg:gap-2.5 shrink-0 min-w-0">
          <div className="bg-primary/20 p-1 lg:p-1.5 rounded-lg border border-primary/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
          </div>
          <h1 className="text-xs lg:text-sm font-black tracking-tight text-white hidden sm:block whitespace-nowrap">
            IPL Optimizer <span className="text-primary italic">Pro</span>
          </h1>
          <h1 className="text-xs font-black tracking-tight text-white sm:hidden whitespace-nowrap">
            IPL <span className="text-secondary italic">Pro</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 lg:gap-3 flex-grow justify-end min-w-0">
           <div className="flex bg-zinc-950/80 p-0.5 lg:p-1 rounded-lg lg:rounded-xl border border-white/10 shrink-0 max-w-full">
             <button onClick={() => setMode('Optimizer')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'Optimizer' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}>Optimizer</button>
             <button onClick={() => setMode('Trader')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'Trader' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-zinc-500 hover:text-zinc-300'}`}>Trader</button>
           </div>
           
           <div className={`hidden sm:flex px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-white/10 text-[8px] lg:text-[10px] uppercase font-black tracking-widest items-center gap-1 lg:gap-2 shrink-0 ${mode === 'Optimizer' ? risk.bg + ' ' + risk.color : (traderProResult.risk === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-secondary/10 text-secondary')}`}>
             <span className="w-1 lg:w-2 h-1 lg:h-2 rounded-full bg-current opacity-70" />
             {mode === 'Optimizer' ? risk.level : traderProResult.risk}
           </div>
        </div>
      </div>
    </nav>
  );

  const renderMatchSetup = ({ isDesktop = false }) => (
    <div className={`flex flex-col ${isDesktop ? 'h-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'h-full flex-1 min-h-0 pt-2'}`}>
      {isDesktop && <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />}
      <div className={`flex items-center gap-2 ${isDesktop ? 'mb-4' : 'mb-2'} relative z-10 shrink-0`}>
         <div className="p-1 bg-primary/10 rounded-md"><Calculator className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-primary`} /></div>
         <h2 className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-white leading-none`}>Match Setup</h2>
      </div>
      <div className={`flex flex-col ${isDesktop ? 'gap-4 overflow-hidden' : 'gap-2 justify-start'} relative z-10 flex-1 min-h-0`}>
        <div className={`bg-zinc-900/50 ${isDesktop ? 'p-4' : 'p-2.5'} rounded-xl border border-white/5 relative shrink-0`}>
          <label className={`flex justify-between ${isDesktop ? 'text-[11px]' : 'text-[9px]'} text-zinc-400 mb-1.5 font-bold uppercase tracking-wider leading-none`}>
            <span>Total Capital</span>
            <span className="text-primary">pts</span>
          </label>
          <input type="number" min="10" step="10" value={total || ''} onChange={e => setTotal(+e.target.value)} className={`w-full bg-black/40 text-white ${isDesktop ? 'text-2xl' : 'text-xl'} font-black px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none transition-all leading-none`} />
        </div>
        <div className={`grid grid-cols-2 ${isDesktop ? 'gap-3' : 'gap-2'} shrink-0`}>
          <div className={`bg-zinc-900/50 ${isDesktop ? 'p-4' : 'p-2'} rounded-xl border border-white/5`}>
            <label className={`${isDesktop ? 'text-[10px]' : 'text-[8px]'} uppercase tracking-wider text-zinc-400 block mb-1 font-bold leading-none`}>Team A Odds</label>
            <div className={`flex items-center gap-2 bg-black/40 ${isDesktop ? 'px-3 py-2' : 'px-2 py-1.5'} rounded-lg border border-white/5 focus-within:border-primary/50 transition-all`}>
              <span className="text-zinc-500 font-medium text-xs">x</span>
              <input type="number" step="0.01" min="1.01" value={r1 || ''} onChange={e => setR1(+e.target.value)} className={`w-full bg-transparent ${isDesktop ? 'text-lg' : 'text-base'} font-bold outline-none text-white focus:text-primary transition-colors leading-none`} />
            </div>
          </div>
          <div className={`bg-zinc-900/50 ${isDesktop ? 'p-4' : 'p-2'} rounded-xl border border-white/5`}>
            <label className={`${isDesktop ? 'text-[10px]' : 'text-[8px]'} uppercase tracking-wider text-zinc-400 block mb-1 font-bold leading-none`}>Team B Odds</label>
            <div className={`flex items-center gap-2 bg-black/40 ${isDesktop ? 'px-3 py-2' : 'px-2 py-1.5'} rounded-lg border border-white/5 focus-within:border-secondary/50 transition-all`}>
              <span className="text-zinc-500 font-medium text-xs">x</span>
              <input type="number" step="0.01" min="1.01" value={r2 || ''} onChange={e => setR2(+e.target.value)} className={`w-full bg-transparent ${isDesktop ? 'text-lg' : 'text-base'} font-bold outline-none text-white focus:text-secondary transition-colors leading-none`} />
            </div>
          </div>
        </div>
        <div className={`bg-zinc-900/50 ${isDesktop ? 'p-4' : 'p-2.5'} rounded-xl border border-white/5 relative shrink-0`}>
          <label className={`flex items-center gap-1.5 ${isDesktop ? 'text-[10px]' : 'text-[8px]'} text-zinc-400 mb-1.5 font-bold uppercase tracking-wider leading-none`}>
            <Sparkles className="w-3.5 h-3.5 text-secondary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            Win Probability (A)
          </label>
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center gap-2 bg-black/40 ${isDesktop ? 'px-3 py-2.5' : 'px-2 py-1.5'} rounded-lg border border-white/5 focus-within:border-secondary/50 transition-all`}>
              <input type="number" min="0" max="100" step="1" value={+(p1*100).toFixed(0) || 0} onChange={e => {
                  const val = Math.min(100, Math.max(0, +e.target.value));
                  setP1(val / 100);
                }} className={`w-full bg-transparent ${isDesktop ? 'text-xl' : 'text-lg'} font-black outline-none text-white focus:text-secondary transition-colors text-center leading-none`} />
              <span className="text-zinc-500 font-medium text-sm">%</span>
            </div>
            <div className="flex-[0.5] bg-black/40 px-2 py-2.5 rounded-lg border border-white/5 opacity-80 flex flex-col justify-center items-center">
              <div className="text-[9px] text-zinc-500 mb-1 leading-none">Team B</div>
              <div className="text-sm font-bold text-white leading-none">{(p2*100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlgorithmStrategy = ({ isDesktop = false }) => (
    <div className={`flex flex-col ${isDesktop ? 'h-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'h-full flex-1 pt-2'}`}>
      {isDesktop && <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />}
      <div className={`flex items-center gap-2 ${isDesktop ? 'mb-4' : 'mb-2'} relative z-10 shrink-0`}>
         <div className="p-1 bg-secondary/10 rounded-md"><Zap className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-secondary`} /></div>
         <h2 className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-white leading-none`}>Strategy Hub</h2>
      </div>
      <div className={`flex-1 grid grid-cols-2 grid-rows-2 ${isDesktop ? 'gap-3' : 'gap-2'} relative z-10 min-h-0 items-stretch`}>
        {[
          { id: 'Safe', icon: ShieldCheck, desc: 'Hedging' },
          { id: 'Balanced', icon: Activity, desc: 'Weighted' },
          { id: 'Aggressive', icon: Zap, desc: 'Max Returns' },
          { id: 'Value', icon: TrendingUp, desc: 'Find Edges' }
        ].map((s) => (
          <button key={s.id} onClick={() => setStrategy(s.id as Strategy)} className={`relative p-2 rounded-xl border transition-all duration-300 overflow-hidden group flex flex-col justify-center items-center text-center w-full h-full ${strategy === s.id ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-primary/50 shadow-lg' : 'bg-zinc-900/40 border-white/5 hover:bg-white/5'}`}>
            {strategy === s.id && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 pointer-events-none" />}
            <s.icon className={`${isDesktop ? 'w-6 h-6 mb-2' : 'w-5 h-5 mb-1'} transition-colors ${strategy === s.id ? 'text-primary drop-shadow-md' : 'text-zinc-500'}`} />
            <div className={`font-bold ${isDesktop ? 'text-xs' : 'text-[10px]'} tracking-wide ${strategy === s.id ? 'text-white' : 'text-zinc-300'}`}>{s.id}</div>
            <div className={`${isDesktop ? 'text-[8px]' : 'text-[7px]'} text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold`}>{s.desc}</div>
          </button>
        ))}
      </div>
      {strategyUsed && (
        <div className={`${isDesktop ? 'mt-4 p-3' : 'mt-2 p-2'} rounded-xl bg-primary/10 border border-primary/20 text-center shrink-0 relative z-10`}>
          <div className="text-[9px] text-primary mb-1 font-black tracking-widest uppercase flex justify-center items-center gap-1.5 leading-none">
             <Sparkles className="w-3 h-3" /> {strategyUsed}
          </div>
          <div className={`${isDesktop ? 'text-xs' : 'text-[10px]'} font-medium text-white leading-tight`}>
             {valueDetected ? 'Positive edge found.' : 'Optimization applied.'}
          </div>
        </div>
      )}
    </div>
  );

  const renderProjections = ({ isDesktop = false }) => (
    <div className={`flex flex-col h-full ${isDesktop ? 'bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'flex-1 pt-2'}`}>
      {isDesktop && <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />}
      <div className={`flex items-center gap-2 ${isDesktop ? 'mb-4' : 'mb-2'} shrink-0 relative z-10`}>
         <div className="p-1.5 bg-green-500/10 rounded-md"><TrendingUp className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-green-500`} /></div>
         <h2 className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-white leading-none`}>Live Projections</h2>
      </div>
      <div className={`shrink-0 ${isDesktop ? 'mb-4' : 'mb-2'} flex items-center relative z-10`}>
        {arbitrageDetected ? (
          <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 p-2 rounded-lg flex items-center gap-2 text-[10px] font-medium"><ShieldCheck className="w-4 h-4 flex-shrink-0" /> Guaranteed Profit!</div>
        ) : !valueDetected ? (
          <div className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-2 rounded-lg flex items-center gap-2 text-[10px] font-medium"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> Low Value.</div>
        ) : <div className="w-full p-2 bg-zinc-900/30 rounded-lg border border-white/5 text-center text-[9px] text-zinc-500 font-medium">Optimal edge found.</div>}
      </div>
      <div className={`grid grid-cols-2 ${isDesktop ? 'gap-3 mb-4' : 'gap-2 mb-2'} shrink-0 relative z-10`}>
        <div className={`bg-zinc-800/80 ${isDesktop ? 'p-4' : 'p-2.5'} rounded-xl border border-white/5 text-center relative overflow-hidden`}>
           <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1 relative z-10">A</div>
           <div className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-black text-white relative z-10`}>{x.toFixed(1)} <span className="text-[9px] text-zinc-600">pts</span></div>
           <div className={`text-base font-black ${profitA >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profitA >= 0 ? '+' : ''}{profitA.toFixed(1)}</div>
        </div>
        <div className={`bg-zinc-800/80 ${isDesktop ? 'p-4' : 'p-2.5'} rounded-xl border border-white/5 text-center relative overflow-hidden`}>
           <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1 relative z-10">B</div>
           <div className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-black text-white relative z-10`}>{y.toFixed(1)} <span className="text-[9px] text-zinc-600">pts</span></div>
           <div className={`text-base font-black ${profitB >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profitB >= 0 ? '+' : ''}{profitB.toFixed(1)}</div>
        </div>
      </div>
      <div className={`bg-black/40 ${isDesktop ? 'p-3' : 'p-2'} rounded-xl border border-white/5 flex-1 relative min-h-0 relative z-10`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v>0?'+':''}${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '9px' }} />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderLiveTrader = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    
    return (
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-2 lg:p-4 overflow-hidden relative z-10 flex flex-col gap-4">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 flex-1 relative">
            {/* Market (Tab: Input) */}
            {(!isMobile || activeTab === 'Input') && (
              <motion.div initial={isMobile ? { opacity: 0, x: -20 } : {}} animate={{ opacity: 1, x: 0 }} className={`flex flex-col gap-4 min-h-0 ${isMobile ? 'overflow-y-auto pb-24' : ''}`}>
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-2xl relative flex flex-col shrink-0 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                    <div className="flex items-center gap-2 mb-4 shrink-0 text-secondary relative z-10">
                       <Activity className="w-5 h-5" />
                       <h2 className="text-base font-black uppercase tracking-widest italic">Live Market</h2>
                    </div>
                    <div className="space-y-4 relative z-10">
                       <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">A Odds</label>
                          <div className="flex items-baseline gap-2">
                             <input type="number" step="0.01" value={currentOddsA} onChange={e => setCurrentOddsA(+e.target.value)} className="w-full bg-transparent text-3xl font-black text-white focus:text-primary outline-none transition-colors leading-none" />
                             <span className="text-[10px] text-zinc-600 font-bold">LIVE</span>
                          </div>
                       </div>
                       <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 hover:border-secondary/30 transition-colors">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">B Odds</label>
                          <div className="flex items-baseline gap-2">
                             <input type="number" step="0.01" value={currentOddsB} onChange={e => setCurrentOddsB(+e.target.value)} className="w-full bg-transparent text-3xl font-black text-white focus:text-secondary outline-none transition-colors leading-none" />
                             <span className="text-[10px] text-zinc-600 font-bold">LIVE</span>
                          </div>
                       </div>
                       <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none mb-3">
                             <span className="text-zinc-500 italic">Prob (A)</span>
                             <span className="text-secondary text-base">{(predP1*100).toFixed(0)}%</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.01" value={predP1} onChange={e => setPredP1(+e.target.value)} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-secondary" />
                       </div>
                    </div>
                 </div>

                 {isMobile && (
                   <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden flex flex-col shrink-0 shadow-2xl">
                      <div className="px-4 py-2 border-b border-white/5 bg-zinc-800/50 flex items-center justify-between shrink-0">
                         <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="font-black uppercase text-[10px] italic tracking-widest text-white">Stack</span>
                         </div>
                         <span className="bg-zinc-800 border border-white/5 text-zinc-400 text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest">{stakes.length} ACTIVE</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto bg-zinc-900/90 relative">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-800/80 text-[9px] uppercase font-black text-zinc-500 tracking-wider sticky top-0 z-20 border-b border-white/5">
                               <tr><th className="px-4 py-2">T</th><th className="px-1 py-2 text-center">Amt</th><th className="px-1 py-2 text-center">Odds</th><th className="px-4 py-2 text-right">✕</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative z-10">
                               {stakes.map(s => (
                                  <tr key={s.id} className="text-[11px] hover:bg-white/[0.03]">
                                     <td className={`px-4 py-3 font-black uppercase ${s.team === 'A' ? 'text-primary' : 'text-secondary'}`}>{s.team}</td>
                                     <td className="px-1 py-3 text-center font-black text-white">₹{s.amount}</td>
                                     <td className="px-1 py-3 text-center font-black text-zinc-300">@{s.odds}</td>
                                     <td className="px-4 py-3 text-right"><button onClick={() => removeStake(s.id)} className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 font-bold flex items-center justify-center">✕</button></td>
                                  </tr>
                               ))}
                               {stakes.length === 0 && (
                                 <tr><td colSpan={4} className="py-8 text-center text-[10px] font-black text-zinc-600 italic uppercase">Empty Stack</td></tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                      <div className="p-3 bg-zinc-950 border-t border-white/5 flex flex-col gap-3">
                         <div className="flex flex-col gap-1.5 px-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 italic">Amount to Place (Hedge)</label>
                            <div className="relative">
                               <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                  <span className="text-secondary text-xs font-black">₹</span>
                               </div>
                               <input type="number" value={traderAmount || ''} onChange={e => setTraderAmount(+e.target.value)} className="w-full bg-zinc-900/50 text-white text-lg font-black pl-8 pr-4 py-2 rounded-xl border border-white/10 focus:border-secondary/40 outline-none transition-all shadow-inner" placeholder="0" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addStake('A')} className="py-2.5 bg-primary text-black rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform shadow-primary/20">Add RR (A)</button>
                            <button onClick={() => addStake('B')} className="py-2.5 bg-secondary text-black rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform shadow-secondary/20">Add CSK (B)</button>
                         </div>
                      </div>
                   </div>
                 )}

                 {!isMobile && (
                   <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col overflow-hidden group">
                      <div className="flex items-center gap-2 mb-6 shrink-0 text-primary">
                         <Sparkles className="w-5 h-5 hover:rotate-12 transition-transform" />
                         <h2 className="text-base font-black uppercase tracking-tighter italic">Analysis</h2>
                      </div>
                      <div className="flex-1 flex flex-col justify-center text-center">
                         <div className="text-[10px] uppercase font-black text-zinc-500 mb-2 tracking-[0.2em]">Strategy</div>
                         <div className="text-lg font-black text-white mb-6 uppercase tracking-tight">{traderProResult.strategy} Mode</div>
                         <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 shadow-inner">
                            <p className="text-zinc-300 text-xs font-bold italic leading-relaxed">"{traderProResult.reason}"</p>
                         </div>
                      </div>
                   </div>
                 )}
              </motion.div>
            )}

            {/* Summary (Active on desktop, Tab-dependent on mobile) */}
            {(!isMobile || activeTab === 'Strategy') && (
              <motion.div initial={isMobile ? { opacity: 0, x: 20 } : {}} animate={{ opacity: 1, x: 0 }} className={`flex flex-col gap-4 min-h-0 ${isMobile ? 'overflow-y-auto pb-24' : ''}`}>
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-2xl relative flex-1 min-h-0 flex flex-col group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
                       <div className="flex items-center gap-2 text-green-400">
                          <PieChart className="w-5 h-5" />
                          <h2 className="text-base font-black uppercase tracking-widest italic">Live Summary</h2>
                       </div>
                       <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Active HUD</span>
                       </div>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col relative z-10">
                       <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner shrink-0">
                          <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bankroll</label>
                             <Wallet className="w-3.5 h-3.5 text-primary/40" />
                          </div>
                          <div className="flex items-baseline gap-1.5">
                             <span className="text-zinc-500 text-xl font-black italic">₹</span>
                             <input type="number" value={traderCapital} onChange={e => setTraderCapital(+e.target.value)} className="w-full bg-transparent text-4xl font-black text-white outline-none" />
                          </div>
                       </div>

                       <div className="px-1 shrink-0">
                          <div className="flex justify-between items-end mb-2">
                             <div>
                                <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Total Exposure</div>
                                <div className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">₹{traderProResult.totalInvested.toFixed(0)}</div>
                             </div>
                             <div className="text-right">
                                <div className={`text-xs font-black italic ${((traderProResult.totalInvested / traderCapital) * 100) > 80 ? 'text-red-500' : 'text-primary'}`}>
                                   {((traderProResult.totalInvested / traderCapital) * 100).toFixed(1)}% Used
                                </div>
                             </div>
                          </div>
                          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (traderProResult.totalInvested / traderCapital) * 100)}%` }} className={`h-full transition-all duration-1000 ${traderProResult.totalInvested > traderCapital * 0.8 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-primary to-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`} />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 gap-3 shrink-0">
                          {[
                            { team: 'A', val: traderProResult.pA },
                            { team: 'B', val: traderProResult.pB }
                          ].map(p => (
                            <div key={p.team} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${p.val >= 0 ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.03)]' : 'bg-red-500/5 border-red-500/20'}`}>
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic shadow-inner ${p.val >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.team}</div>
                                  <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Projection</div>
                               </div>
                               <div className={`text-2xl font-black italic tracking-tighter ${p.val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {p.val >= 0 ? '+' : ''}₹{Math.abs(p.val).toFixed(0)}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* Position Stack / Suggest (Dynamic) */}
            {!isMobile && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-2xl relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                 <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-3">
                       <Zap className="w-5 h-5 text-primary" />
                       <h2 className="text-lg font-black uppercase tracking-tighter italic text-white/90">Position Stack</h2>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                       <div className="relative group/input hidden md:block">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">₹</span>
                          <input type="number" value={traderAmount || ''} onChange={e => setTraderAmount(+e.target.value)} className="w-24 bg-zinc-950/80 border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-white focus:border-secondary/50 outline-none transition-all shadow-inner" placeholder="Amt" />
                       </div>
                       <button onClick={() => addStake('A')} className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black hover:bg-primary hover:text-black transition-all shadow-lg active:scale-95">Add RR (A)</button>
                       <button onClick={() => addStake('B')} className="px-4 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-xs font-black hover:bg-secondary hover:text-black transition-all shadow-lg active:scale-95">Add CSK (B)</button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-auto bg-zinc-950/20 relative z-10 min-h-0">
                    <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-md text-[11px] uppercase font-black text-zinc-500 tracking-[0.1em] border-b border-white/5 z-20">
                          <tr>
                             <th className="px-6 py-4">Position</th>
                             <th className="px-6 py-4">Stake Amt</th>
                             <th className="px-6 py-4">Entry Odds</th>
                             <th className="px-6 py-4">Projection</th>
                             <th className="px-6 py-4 text-center">Delete</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {stakes.map(s => (
                             <tr key={s.id} className="group hover:bg-white/[0.03] transition-all duration-200">
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase shadow-inner ${s.team === 'A' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/20 text-secondary border border-secondary/30'}`}>
                                      {s.team === 'A' ? 'Team RR' : 'Team CSK'} {s.team}
                                   </span>
                                </td>
                                <td className="px-6 py-4"><input type="number" value={s.amount} onChange={e => updateStake(s.id, 'amount', +e.target.value)} className="bg-zinc-800/80 px-3 py-1.5 rounded-lg text-sm font-black text-white w-24 border border-white/5 focus:border-primary/50 outline-none shadow-inner" /></td>
                                <td className="px-6 py-4"><input type="number" step="0.1" value={s.odds} onChange={e => updateStake(s.id, 'odds', +e.target.value)} className="bg-zinc-800/80 px-3 py-1.5 rounded-lg text-sm font-black text-white w-20 border border-white/5 focus:border-secondary/50 outline-none shadow-inner" /></td>
                                <td className="px-6 py-4">
                                   <div className="font-black text-base text-white tracking-tight">₹{(s.amount * s.odds).toFixed(0)}</div>
                                   <div className="text-[10px] text-zinc-500 font-bold">Estimated Return</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <button onClick={() => removeStake(s.id)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold transition-all hover:bg-red-600 hover:text-white shadow-lg active:scale-90">✕</button>
                                </td>
                             </tr>
                          ))}
                          {stakes.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-20 text-center flex flex-col items-center gap-3">
                                  <div className="p-4 rounded-full bg-zinc-900 border border-white/5"><AlertTriangle className="w-8 h-8 text-zinc-600" /></div>
                                  <div className="text-zinc-600 font-bold uppercase text-xs tracking-widest italic">No Open Positions Detected</div>
                               </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* Desktop Bottom Action Indicator */}
                 <div className="p-6 bg-zinc-950 border-t border-white/10 shrink-0 relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20 animate-pulse">
                          <TrendingUp className="w-6 h-6 text-primary" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recommended Action</div>
                          <div className="text-2xl font-black text-white uppercase tracking-tighter">{traderProResult.nextAction}</div>
                       </div>
                    </div>
                    {traderProResult.suggestAmt > 0 && (
                       <div className="text-right">
                          <div className="text-[10px] font-black text-primary uppercase tracking-widest">Suggested Stake</div>
                          <div className="text-4xl font-black text-primary drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] tracking-tighter animate-bounce">₹{traderProResult.suggestAmt.toFixed(0)}</div>
                       </div>
                    )}
                 </div>
              </motion.div>
            )}

            {/* Mobile Suggest Tab Fix */}
            {isMobile && activeTab === 'Results' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 min-h-0 overflow-y-auto pb-24">
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col shrink-0 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex items-center gap-2 mb-8 shrink-0 text-primary">
                       <Sparkles className="w-6 h-6" />
                       <h2 className="text-lg font-black uppercase tracking-tighter italic">AI Recommendation</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-center text-center px-2 py-4">
                       <div className="text-[11px] uppercase font-black text-zinc-500 mb-6 tracking-[0.3em] leading-none">Smart Action</div>
                       <div className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight drop-shadow-lg">{traderProResult.nextAction}</div>
                       {traderProResult.suggestAmt > 0 && (
                         <div className="flex flex-col items-center mb-8">
                            <div className="text-5xl font-black text-primary tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse">₹{traderProResult.suggestAmt.toFixed(0)}</div>
                            <div className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-2">Optimal Entry Stake</div>
                         </div>
                       )}
                       <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-sm">
                          <p className="text-zinc-300 text-sm font-bold italic leading-relaxed">"{traderProResult.reason}"</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                       <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-[9px] text-zinc-500 font-extrabold uppercase mb-1">Strategy</div>
                          <div className="text-[11px] font-black text-white uppercase tracking-wider">{traderProResult.strategy}</div>
                       </div>
                       <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-[9px] text-zinc-500 font-extrabold uppercase mb-1">Risk Scale</div>
                          <div className={`text-[11px] font-black uppercase tracking-wider ${traderProResult.risk === 'High' ? 'text-red-500' : 'text-green-500'}`}>{traderProResult.risk}</div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full dark bg-[#050505] font-sans text-white selection:bg-primary/30 relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      {renderHeader({ className: mode === 'Trader' ? 'border-secondary/20' : '' })}
      <div className="shrink-0 relative z-20 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md h-[48px] flex items-center">
         <div className="w-full max-w-[1500px] mx-auto px-4 flex items-center justify-between"><LiveMatchCard /></div>
      </div>
       <main className="flex-1 min-h-0 relative z-10 overflow-hidden bg-zinc-950/20">
         <AnimatePresence mode="wait">
           {mode === 'Optimizer' ? (
             <motion.div key="Optimizer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col overflow-hidden px-4 pt-4 pb-20 lg:pb-4">
                <div className="hidden lg:flex flex-1 max-w-[1600px] w-full mx-auto overflow-hidden">
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                      <div className="h-full flex flex-col min-h-0">{renderMatchSetup({ isDesktop: true })}</div>
                      <div className="h-full flex flex-col min-h-0">{renderAlgorithmStrategy({ isDesktop: true })}</div>
                      <div className="h-full flex flex-col min-h-0">{renderProjections({ isDesktop: true })}</div>
                   </div>
                </div>
                <div className="lg:hidden flex flex-col flex-1 h-full overflow-hidden relative">
                   <div className="flex-1 relative overflow-hidden min-h-0">
                     <AnimatePresence mode="popLayout" initial={false}>
                       {activeTab === 'Input' && <motion.div key="Input" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">{renderMatchSetup({})}</motion.div>}
                       {activeTab === 'Strategy' && <motion.div key="Strategy" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">{renderAlgorithmStrategy({})}</motion.div>}
                       {activeTab === 'Results' && <motion.div key="Results" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">{renderProjections({})}</motion.div>}
                     </AnimatePresence>
                   </div>
                </div>
             </motion.div>
           ) : (
             <motion.div key="Trader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col overflow-hidden px-2 pt-2 pb-20 lg:p-0">
               {renderLiveTrader()}
             </motion.div>
           )}
         </AnimatePresence>
       </main>
      {/* Bottom Taskbar: Always visible on mobile, dynamic labels based on mode */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl h-[60px] flex justify-around items-center px-4 z-50 pb-safe">
         {(mode === 'Optimizer' 
           ? [{ id: 'Input', icon: Calculator, label: 'Inputs' }, { id: 'Strategy', icon: Zap, label: 'Strategy' }, { id: 'Results', icon: Activity, label: 'Results' }]
           : [{ id: 'Input', icon: Activity, label: 'Market' }, { id: 'Strategy', icon: ShieldCheck, label: 'Summary' }, { id: 'Results', icon: Sparkles, label: 'Suggest' }]
         ).map((tab) => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className="flex flex-col items-center justify-center gap-1 w-16 h-full relative">
             {activeTab === tab.id && <motion.div layoutId="nav-pill-fixed" className="absolute top-0 w-8 h-0.5 bg-primary bg-blue-500 shadow-blue-500 shadow-lg" />}
             <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'text-primary' : 'text-zinc-500'}`} />
             <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-primary' : 'text-zinc-500'}`}>{tab.label}</span>
           </button>
         ))}
      </div>
    </div>
  );
}
