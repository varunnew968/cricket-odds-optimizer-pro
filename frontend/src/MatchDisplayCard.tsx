import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const teamLogos: { [key: string]: string } = {
  CSK: "/logos/csk.png",
  MI: "/logos/mi.png",
  RCB: "/logos/rcb.png",
  RR: "/logos/rr.png",
  SRH: "/logos/srh.png",
  KKR: "/logos/kkr.png",
  DC: "/logos/dc.png",
  PBKS: "/logos/pbks.png",
  LSG: "/logos/lsg.png",
  GT: "/logos/gt.png"
};

const teamColors: { [key: string]: string } = {
  CSK: 'from-yellow-400 to-yellow-600',
  MI: 'from-blue-500 to-blue-700',
  RCB: 'from-red-500 to-red-700',
  RR: 'from-pink-500 to-pink-700',
  SRH: 'from-orange-500 to-orange-700',
  KKR: 'from-purple-600 to-purple-800',
  DC: 'from-blue-400 to-blue-600',
  PBKS: 'from-red-400 to-red-600',
  LSG: 'from-cyan-400 to-cyan-600',
  GT: 'from-slate-600 to-slate-800'
};

interface MatchDisplayCardProps {
  team1: string;
  team2: string;
  status?: string;
  subStatus?: string;
}

export default function MatchDisplayCard({ team1, team2, status, subStatus }: MatchDisplayCardProps) {
  const isLive = status === 'LIVE';

  const renderLogo = (team: string) => {
    const logoUrl = teamLogos[team] || "/logos/fallback.png";
    const colorClass = teamColors[team] || 'from-zinc-700 to-zinc-900';

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div 
          className="relative overflow-hidden w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center p-0"
        >
          <img 
            src={logoUrl} 
            alt={team} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const sibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (sibling) sibling.style.display = 'flex';
            }}
          />
          <span className="hidden text-2xl lg:text-3xl font-black text-white select-none whitespace-nowrap">{team}</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
        </motion.div>
        <span className="text-[10px] lg:text-xs font-black text-zinc-400 uppercase tracking-widest">{team}</span>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group max-w-lg w-full"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-white/5 to-secondary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition duration-1000"></div>

      <div className="relative bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col items-center">
        
        {/* Status Badge */}
        <div className={`absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full border ${isLive ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-zinc-800/80 border-white/5 text-zinc-500'} text-[10px] font-black uppercase tracking-widest shadow-lg`}>
           {isLive && (
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
             </span>
           )}
           <Radio className={`w-3 h-3 ${isLive ? 'animate-pulse' : ''}`} />
           <span>{status || 'Upcoming'}</span>
        </div>

        <div className="flex items-center justify-between w-full gap-8 lg:gap-16 mb-8 mt-2">
           {renderLogo(team1)}

           <div className="flex flex-col items-center justify-center">
              <div className="text-2xl lg:text-3xl font-black text-zinc-700/50 mb-2 italic tracking-tighter">VS</div>
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
           </div>

           {renderLogo(team2)}
        </div>

        {subStatus && (
           <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-3 backdrop-blur-md shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
              <p className="text-[10px] lg:text-xs font-bold text-zinc-400 italic text-center uppercase tracking-wide truncate max-w-[280px]">
                 {subStatus}
              </p>
           </div>
        )}
      </div>
    </motion.div>
  );
}
