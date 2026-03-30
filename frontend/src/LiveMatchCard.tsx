import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Radio, Clock, Lock, Unlock, Calendar } from 'lucide-react';
import scheduleData from './data/ipl_schedule.json';

const teamLogos: { [key: string]: string } = {
  CSK: "/logos/csk.png", MI: "/logos/mi.png", RCB: "/logos/rcb.png", RR: "/logos/rr.png",
  SRH: "/logos/srh.png", KKR: "/logos/kkr.png", DC: "/logos/dc.png", PBKS: "/logos/pbks.png",
  LSG: "/logos/lsg.png", GT: "/logos/gt.png"
};

export default function LiveMatchCard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { activeMatch, nextMatch, bettingEnabled } = useMemo(() => {
    // Fixed current date for demo stability as per system context: 2026-03-30
    const todayStr = '2026-03-30';
    const matches = scheduleData;
    
    const todayMatch = matches.find(m => m.date === todayStr);
    
    let active = null;
    let next = null;
    let betting = false;

    if (todayMatch) {
       const [h, m] = todayMatch.time.split(':').map(Number);
       const matchStartTime = new Date(2026, 2, 30, h, m); // Month is 0-indexed (March = 2)
       const matchEndTime = new Date(matchStartTime.getTime() + 4 * 60 * 60 * 1000);
       
       const now = currentTime;
       
       if (now < matchStartTime) {
          active = { ...todayMatch, status: 'UPCOMING', label: "Today's Match" };
          betting = false;
       } else if (now >= matchStartTime && now < matchEndTime) {
          active = { ...todayMatch, status: 'LIVE', label: "In Play" };
          betting = true;
       } else {
          // Completed
          active = { ...todayMatch, status: 'COMPLETED', label: "Today's Match" };
          betting = false;
          // Find next
          next = matches.find(m => m.date > todayStr) || null;
       }
    } else {
       // No match today, find next
       next = matches.find(m => m.date > todayStr) || null;
    }

    return { activeMatch: active, nextMatch: next, bettingEnabled: betting };
  }, [currentTime]);

  const renderStrip = (match: any, isNext: boolean = false) => (
    <div className={`flex items-center gap-2 lg:gap-4 ${isNext ? 'opacity-60 bg-zinc-950/20 px-4 py-1.5' : 'bg-zinc-900/40 px-3 py-1.5'} rounded-xl border border-white/5`}>
       <div className="flex items-center gap-1.5 lg:gap-2">
          <span className="hidden lg:block text-[7px] font-black uppercase tracking-widest text-zinc-500">{isNext ? 'Next Up' : match.label}</span>
          <div className="flex items-center gap-1 shrink-0">
             <img src={teamLogos[match.team1]} className="w-5 h-5 object-contain" alt="" />
             <span className="text-[10px] font-black text-white">{match.team1}</span>
             <span className="hidden lg:inline text-[8px] font-black text-zinc-700">VS</span>
             <span className="text-[10px] font-black text-white">{match.team2}</span>
             <img src={teamLogos[match.team2]} className="w-5 h-5 object-contain" alt="" />
          </div>
       </div>

       <div className="flex items-center gap-3">
          <div className="h-3 w-px bg-white/10"></div>
          <div className="flex items-center gap-1.5">
             {match.status === 'LIVE' ? (
                <div className="flex items-center gap-1 text-green-500 animate-pulse">
                   <Radio className="w-2.5 h-2.5" />
                   <span className="text-[8px] font-black tracking-widest uppercase">LIVE</span>
                </div>
             ) : (
                <div className="flex items-center gap-1 text-zinc-500">
                   <Clock className="w-2.5 h-2.5" />
                   <span className="text-[8px] font-black tracking-widest uppercase">{match.time}</span>
                </div>
             )}
          </div>
       </div>

       {!isNext && (
          <>
             <div className="h-3 w-px bg-white/10"></div>
             <div className="flex items-center gap-1.5">
                {bettingEnabled ? (
                   <div className="flex items-center gap-1 text-primary">
                      <Unlock className="w-2.5 h-2.5" />
                      <span className="text-[7px] font-black uppercase tracking-widest">Market Open</span>
                   </div>
                ) : (
                   <div className="flex items-center gap-1 text-red-500/60">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="text-[7px] font-black uppercase tracking-widest">{match.status === 'COMPLETED' ? 'Finished' : 'Locked'}</span>
                   </div>
                )}
             </div>
          </>
       )}
    </div>
  );

  return (
    <div className="flex items-center gap-4 w-full select-none overflow-hidden h-[48px]">
       <AnimatePresence mode="wait">
          {activeMatch && (
             <motion.div key={activeMatch.status + activeMatch.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {renderStrip(activeMatch)}
             </motion.div>
          )}
          
          {(activeMatch?.status === 'COMPLETED' || !activeMatch) && nextMatch && (
             <motion.div key="nextMatch" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                {renderStrip(nextMatch, true)}
             </motion.div>
          )}

          {!activeMatch && !nextMatch && (
             <motion.div key="empty" className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-white/5">
                <Calendar className="w-3 h-3 text-zinc-700" />
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">No Matches Available</span>
             </motion.div>
          )}
       </AnimatePresence>

       <div className="flex-1"></div>

       <div className="flex items-center gap-4 shrink-0 pr-2">
          <div className="hidden lg:flex items-center gap-2">
             <Activity className="w-3 h-3 text-secondary" />
             <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">IPL Scheduler 2026</span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden lg:block"></div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] font-bold text-zinc-500">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
       </div>
    </div>
  );
}
