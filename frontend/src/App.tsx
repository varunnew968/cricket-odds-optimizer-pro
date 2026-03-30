import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap, Activity, Calculator, Sparkles, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

type Strategy = 'Safe' | 'Balanced' | 'Aggressive' | 'Value';
type Tab = 'Input' | 'Strategy' | 'Results';

export default function App() {
  const [total, setTotal] = useState(200);
  const [r1, setR1] = useState(1.9);
  const [r2, setR2] = useState(2.1);
  const [p1, setP1] = useState(0.5);
  const [strategy, setStrategy] = useState<Strategy>('Safe');
  const [activeTab, setActiveTab] = useState<Tab>('Input');

  const p2 = +(1 - p1).toFixed(2);
  const ip1 = 1 / r1;
  const ip2 = 1 / r2;
  const isArbitrage = ip1 + ip2 < 1;

  const result = useMemo(() => {
    let x = 0, y = 0;
    
    // 1. Kelly Criterion Fractions (f*)
    // Formula: f* = (p * (odds - 1) - (1 - p)) / (odds - 1)
    const b1 = r1 - 1;
    const k1 = b1 > 0 ? (p1 * b1 - (1 - p1)) / b1 : 0;
    const kelly1 = Math.max(0, k1);

    const b2 = r2 - 1;
    const k2 = b2 > 0 ? (p2 * b2 - (1 - p2)) / b2 : 0;
    const kelly2 = Math.max(0, k2);

    // Expected Value for a 1 unit bet
    const ev1 = (p1 * r1) - 1;
    const ev2 = (p2 * r2) - 1;
    
    // Quick helper for expected portfolio return
    const getReturn = (aAlloc: number, bAlloc: number) => (aAlloc * ev1) + (bAlloc * ev2);

    // 2. Exact Strategy Allocations
    const safeA = (total * r2) / (r1 + r2);
    const safeB = (total * r1) / (r1 + r2);
    
    const balA = p1 >= p2 ? total * 0.7 : total * 0.3;
    const balB = p1 >= p2 ? total * 0.3 : total * 0.7;

    let aggA = total * kelly1; // Full Kelly (Highest Variance, High Growth)
    let aggB = total * kelly2;
    if (aggA + aggB > total) { const s = total/(aggA+aggB); aggA*=s; aggB*=s; }

    let valA = total * (kelly1 * 0.5); // Half Kelly (Optimal Bankroll Smoothing)
    let valB = total * (kelly2 * 0.5);
    if (valA + valB > total) { const s = total/(valA+valB); valA*=s; valB*=s; }

    const expectedReturns = {
      Safe: (safeA * r1) - total,
      Balanced: getReturn(balA, balB),
      Aggressive: getReturn(aggA, aggB),
      Value: getReturn(valA, valB)
    };

    let bestStrategy: Strategy | 'None' = 'None';
    if (isArbitrage) {
       bestStrategy = 'Safe'; // If guaranteed profit exists, always take it
    } else if (ev1 > 0 || ev2 > 0) {
       bestStrategy = 'Value'; // Mathematically the safest EV edge
    }

    switch (strategy) {
      case 'Safe': x = safeA; y = safeB; break;
      case 'Balanced': x = balA; y = balB; break;
      case 'Aggressive': x = aggA; y = aggB; break;
      case 'Value': x = valA; y = valB; break;
    }
    
    // 3. Profit Calculation (only subtracting what is actually wagered)
    const profitA = (x * r1) - (x + y);
    const profitB = (y * r2) - (x + y);

    return { x, y, profitA, profitB, bestStrategy, expectedReturns };
  }, [total, r1, r2, p1, strategy, ip1, ip2, isArbitrage, p2]);

  const { x, y, profitA, profitB, bestStrategy, expectedReturns } = result;

  const chartData = [
    { name: `Team A (${r1})`, profit: +profitA.toFixed(2), color: profitA >= 0 ? '#22c55e' : '#ef4444' },
    { name: `Team B (${r2})`, profit: +profitB.toFixed(2), color: profitB >= 0 ? '#22c55e' : '#ef4444' }
  ];

  const getRiskLevel = () => {
    if (strategy === 'Safe') return { level: 'Low', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (strategy === 'Balanced') return { level: 'Med', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (strategy === 'Value') return { level: 'Med/High', color: 'text-purple-500', bg: 'bg-purple-500/20' };
    return { level: 'High', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  const risk = getRiskLevel();

  // ----- COMPONENTS CAREFULLY SIZED -----

  const renderHeader = ({ className = "" }: { className?: string }) => (
    <nav className={`border-b border-white/5 bg-zinc-900/40 backdrop-blur-md shrink-0 relative z-20 ${className}`}>
      <div className="px-4 h-12 lg:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="bg-gradient-to-tr from-primary to-secondary p-1.5 rounded-md shadow-lg">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm lg:text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 truncate">
            Odds Optimizer <span className="text-primary italic">Pro</span>
          </h1>
        </div>
        <div className={`px-2 py-1 lg:px-3 lg:py-1 rounded-full border border-white/10 text-[9px] lg:text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 ${risk.bg} ${risk.color} shadow-inner bg-opacity-30 backdrop-blur-md`}>
          <Activity className="w-3 h-3" />
          <span className="hidden lg:inline">{risk.level} Risk</span>
          <span className="lg:hidden">{risk.level}</span>
        </div>
      </div>
    </nav>
  );

  const renderMatchSetup = ({ isDesktop = false }) => (
    <div className={`flex flex-col ${isDesktop ? 'h-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'h-full space-y-3 justify-center'}`}>
      {isDesktop && <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />}
      
      <div className="flex items-center gap-2 mb-4 relative z-10 shrink-0">
         <div className="p-1.5 bg-primary/10 rounded-md"><Calculator className="w-5 h-5 text-primary" /></div>
         <h2 className="text-lg font-bold text-white leading-none">Match Setup</h2>
      </div>

      <div className="flex flex-col gap-4 relative z-10 flex-1 justify-start min-h-0">
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 relative shrink-0">
          <label className="flex justify-between text-[11px] text-zinc-400 mb-2 font-bold uppercase tracking-wider leading-none">
            <span>Total Capital</span>
            <span className="text-primary">pts</span>
          </label>
          <input 
            type="number" min="10" step="10" value={total || ''} onChange={e => setTotal(+e.target.value)}
            className="w-full bg-black/40 text-white text-2xl font-black px-4 py-2.5 rounded-lg border border-white/5 focus:border-primary/50 outline-none transition-all leading-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
            <label className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-2 font-bold leading-none">Team A Odds</label>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-white/5 focus-within:border-primary/50 transition-all">
              <span className="text-zinc-500 font-medium text-sm">x</span>
              <input 
                type="number" step="0.01" min="1.01" value={r1 || ''} onChange={e => setR1(+e.target.value)}
                className="w-full bg-transparent text-lg font-bold outline-none text-white focus:text-primary transition-colors leading-none"
              />
            </div>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
            <label className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-2 font-bold leading-none">Team B Odds</label>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-white/5 focus-within:border-secondary/50 transition-all">
              <span className="text-zinc-500 font-medium text-sm">x</span>
              <input 
                type="number" step="0.01" min="1.01" value={r2 || ''} onChange={e => setR2(+e.target.value)}
                className="w-full bg-transparent text-lg font-bold outline-none text-white focus:text-secondary transition-colors leading-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 relative shrink-0">
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-wider leading-none">
            <Sparkles className="w-3.5 h-3.5 text-secondary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            Implied Win Probability
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-black/40 px-3 py-2.5 rounded-lg border border-white/5 focus-within:border-secondary/50 transition-all">
              <input 
                type="number" min="1" max="99" step="1" value={+(p1*100).toFixed(0) || ''} onChange={e => setP1(Math.min(100, Math.max(0, +e.target.value)) / 100)}
                className="w-full bg-transparent text-xl font-black outline-none text-white focus:text-secondary transition-colors text-center leading-none"
              />
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
    <div className={`flex flex-col ${isDesktop ? 'h-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'h-full justify-center'}`}>
      {isDesktop && <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />}
      
      <div className="flex items-center gap-2 mb-4 relative z-10 shrink-0">
         <div className="p-1.5 bg-secondary/10 rounded-md"><Zap className="w-5 h-5 text-secondary" /></div>
         <h2 className="text-lg font-bold text-white leading-none">Algorithm Strategy</h2>
      </div>
      
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 relative z-10 min-h-0 items-stretch">
        {[
          { id: 'Safe', icon: ShieldCheck, desc: 'Hedging' },
          { id: 'Balanced', icon: Activity, desc: 'Weighted' },
          { id: 'Aggressive', icon: Zap, desc: 'Max Returns' },
          { id: 'Value', icon: TrendingUp, desc: 'Find Edges' }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id as Strategy)}
            className={`relative p-3 rounded-xl border transition-all duration-300 overflow-hidden group flex flex-col justify-center items-center text-center w-full h-full ${
              strategy === s.id 
              ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'bg-zinc-900/40 border-white/5 hover:bg-white/5 hover:border-white/10'
            }`}
          >
            {strategy === s.id && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 pointer-events-none" />
            )}
            <s.icon className={`w-6 h-6 lg:w-7 lg:h-7 mb-2 lg:mb-3 transition-colors ${strategy === s.id ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-zinc-500'}`} />
            <div className={`font-bold text-xs lg:text-sm tracking-wide leading-tight ${strategy === s.id ? 'text-white' : 'text-zinc-300'}`}>{s.id}</div>
            <div className="text-[8px] lg:text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">{s.desc}</div>
          </button>
        ))}
      </div>

      {bestStrategy !== 'None' && (
        <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-center shrink-0 relative z-10">
          <div className="text-[10px] text-primary mb-1 font-black tracking-widest uppercase flex justify-center items-center gap-1.5 leading-none">
             <Sparkles className="w-3 h-3" /> AI Suggestion
          </div>
          <div className="text-xs font-medium text-white leading-tight">
             <strong>{bestStrategy}</strong> strategy maximizes expected value.
          </div>
        </div>
      )}
    </div>
  );

  const renderProjections = ({ isDesktop = false }) => (
    <div className={`flex flex-col h-full ${isDesktop ? 'bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden' : 'justify-center'}`}>
      {isDesktop && <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />}
      
      <div className="flex items-center gap-2 mb-4 shrink-0 relative z-10">
         <div className="p-1.5 bg-green-500/10 rounded-md"><TrendingUp className="w-5 h-5 text-green-500" /></div>
         <h2 className="text-lg font-bold text-white leading-none">Live Projections</h2>
      </div>

      <div className="shrink-0 mb-4 flex items-center relative z-10">
        {isArbitrage ? (
          <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs leading-tight font-medium">Guaranteed Profit possible with Safe Strategy.</p>
          </div>
        ) : (bestStrategy === 'Safe' && expectedReturns?.Safe < 0) ? (
          <div className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs leading-tight font-medium">No guaranteed profit. Overround detected.</p>
          </div>
        ) : <div className="w-full p-3 bg-zinc-900/30 rounded-lg border border-white/5 text-center text-[11px] lg:text-xs text-zinc-500 flex items-center justify-center font-medium">Market is balanced. Expected standard deviation applies.</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 shrink-0 relative z-10">
        <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-4 rounded-xl border border-white/5 relative overflow-hidden text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shadow-black/20">
           <div className="absolute top-[-5%] left-[-5%] text-6xl font-black text-white/5 blur-[2px] select-none pointer-events-none">A</div>
           <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-1.5 relative z-10 flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" />Team A</div>
           <div className="text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-2 relative z-10 leading-none">{x.toFixed(1)} <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">pts</span></div>
           <div className="flex flex-col gap-0.5 border-t border-white/10 pt-2 relative z-10">
             <span className="text-[10px] text-zinc-500 font-bold mb-0.5 leading-none">Return: ₹{(x * r1).toFixed(1)}</span>
             <span className={`text-base font-black leading-none ${profitA >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {profitA >= 0 ? '+' : ''}{profitA.toFixed(1)}
             </span>
           </div>
        </div>
        <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-4 rounded-xl border border-white/5 relative overflow-hidden text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shadow-black/20">
           <div className="absolute top-[-5%] left-[-5%] text-6xl font-black text-white/5 blur-[2px] select-none pointer-events-none">B</div>
           <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-1.5 relative z-10 flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary" />Team B</div>
           <div className="text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-2 relative z-10 leading-none">{y.toFixed(1)} <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">pts</span></div>
           <div className="flex flex-col gap-0.5 border-t border-white/10 pt-2 relative z-10">
             <span className="text-[10px] text-zinc-500 font-bold mb-0.5 leading-none">Return: ₹{(y * r2).toFixed(1)}</span>
             <span className={`text-base font-black leading-none ${profitB >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {profitB >= 0 ? '+' : ''}{profitB.toFixed(1)}
             </span>
           </div>
        </div>
      </div>

      <div className="mb-3 lg:mb-4 shrink-0 px-1 relative z-10">
        <div className="flex justify-between text-[9px] lg:text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider leading-none">
          <span>A: {((x / total) * 100 || 0).toFixed(0)}%</span>
          { (total - x - y) > 1 && <span className="text-zinc-500 font-black text-[8px] animate-pulse">RESERVE: {(((total - x - y) / total) * 100).toFixed(0)}%</span> }
          <span>B: {((y / total) * 100 || 0).toFixed(0)}%</span>
        </div>
        <div className="flex h-2 lg:h-2.5 bg-zinc-900/50 rounded-full w-full overflow-hidden border border-white/5">
          <div style={{ width: `${(x / total) * 100}%` }} className="bg-primary transition-all duration-500" />
          { (total - x - y) > 0 && <div style={{ width: `${((total - x - y) / total) * 100}%` }} className="bg-zinc-800 transition-all duration-500" /> }
          <div style={{ width: `${(y / total) * 100}%` }} className="bg-secondary transition-all duration-500" />
        </div>
      </div>

      <div className="bg-black/40 p-2 pt-4 lg:p-3 lg:pt-5 rounded-xl border border-white/5 flex-1 relative overflow-hidden min-h-[0px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v>0?'+':''}${v}`} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.02)'}}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', padding: '6px 10px' }}
            />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const tabVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: "easeIn" as const } },
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full dark bg-[#050505] font-sans text-white selection:bg-primary/30 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* --- DESKTOP LAYOUT (lg and up) --- */}
      {/* Implemented as a clean 3-column layout horizontally. Completely nullifies any vertical squishing by utilizing ultra-wide desktop space nicely! */}
      <div className="hidden lg:flex flex-col flex-1 max-w-[1500px] w-full mx-auto p-4 overflow-hidden relative z-10">
         {renderHeader({ className: "bg-transparent border-0 mb-4 shrink-0 w-full" })}
         
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 min-h-0 relative items-stretch">
            {/* Column 1 */}
            <div className="h-full overflow-hidden">
                 {renderMatchSetup({ isDesktop: true })}
            </div>
            {/* Column 2 */}
            <div className="h-full overflow-hidden">
                 {renderAlgorithmStrategy({ isDesktop: true })}
            </div>
            {/* Column 3 */}
            <div className="h-full overflow-hidden md:col-span-2 xl:col-span-1">
               {renderProjections({ isDesktop: true })}
            </div>
         </div>
      </div>

      {/* --- MOBILE LAYOUT (below lg) --- */}
      <div className="lg:hidden flex flex-col flex-1 w-full relative z-10 overflow-hidden">
        {renderHeader({ className: "shrink-0" })}

        <main className="flex-1 relative overflow-hidden p-3 shrink-1 min-h-0">
          <AnimatePresence mode="popLayout">
            {activeTab === 'Input' && (
              <motion.div key="Input" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">
                 {renderMatchSetup({})}
              </motion.div>
            )}

            {activeTab === 'Strategy' && (
              <motion.div key="Strategy" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">
                 {renderAlgorithmStrategy({})}
              </motion.div>
            )}

            {activeTab === 'Results' && (
              <motion.div key="Results" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 p-3 pt-4 flex flex-col h-full overflow-hidden">
                 {renderProjections({})}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <div className="border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl shrink-0 h-[64px] flex justify-around items-center px-4 relative z-20 pb-safe">
           {[
             { id: 'Input', icon: Calculator, label: 'Inputs' },
             { id: 'Strategy', icon: Zap, label: 'Strategy' },
             { id: 'Results', icon: Activity, label: 'Results' },
           ].map((tab) => {
             const isActive = activeTab === tab.id;
             const Icon = tab.icon;
             return (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className="flex flex-col items-center justify-center gap-1 w-16 h-full relative group"
               >
                 {isActive && (
                   <motion.div layoutId="nav-pill" className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
                 )}
                 <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'text-zinc-500'}`} />
                 <span className={`text-[9px] font-bold tracking-wide transition-colors ${isActive ? 'text-primary' : 'text-zinc-500'}`}>
                   {tab.label}
                 </span>
               </button>
             )
           })}
        </div>
      </div>
      
    </div>
  );
}
