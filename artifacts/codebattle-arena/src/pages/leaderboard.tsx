import { useState } from "react";
import { useLocation } from "wouter";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Medal, Shield, Swords } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useGetLeaderboard({
    page,
    limit: 50,
    search: search || undefined
  });

  const getTierIcon = (tier: string = 'Beginner') => {
    switch (tier.toLowerCase()) {
      case 'expert': return <Trophy className="w-5 h-5 text-secondary" />;
      case 'specialist': return <Shield className="w-5 h-5 text-primary" />;
      case 'pupil': return <Swords className="w-5 h-5 text-green-400" />;
      default: return <Medal className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTierColor = (tier: string = 'Beginner') => {
    switch (tier.toLowerCase()) {
      case 'expert': return "text-secondary font-bold text-shadow-neon-purple";
      case 'specialist': return "text-primary font-bold text-shadow-neon-cyan";
      case 'pupil': return "text-green-400 font-bold";
      default: return "text-muted-foreground font-medium";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-140px)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-orbitron font-bold tracking-wider mb-2 text-shadow-neon-cyan">GLOBAL RANKINGS</h1>
            <p className="text-muted-foreground font-rajdhani text-lg">The elite competitors of CodeBattle Arena.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search player..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-black/50 border-white/10 h-12 font-mono"
            />
          </div>
        </div>

        <div className="glass-panel rounded-xl border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 font-rajdhani font-bold tracking-wider text-muted-foreground text-sm">
            <div className="col-span-1 text-center">RANK</div>
            <div className="col-span-5">PLAYER</div>
            <div className="col-span-2 text-center">RATING</div>
            <div className="col-span-2 text-center">W/L</div>
            <div className="col-span-2 text-center">WIN RATE</div>
          </div>
          
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-1 flex justify-center"><Skeleton className="h-6 w-6 bg-white/10" /></div>
                  <div className="col-span-5"><Skeleton className="h-6 w-32 bg-white/10" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-16 bg-white/10" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-16 bg-white/10" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-12 bg-white/10" /></div>
                </div>
              ))
            ) : data?.entries.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-rajdhani text-lg">
                No players found.
              </div>
            ) : (
              data?.entries.map((entry) => (
                <div 
                  key={entry.userId}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/profile/${entry.username}`)}
                >
                  <div className="col-span-1 text-center font-orbitron font-bold text-lg text-white/50">
                    #{entry.rank}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    {getTierIcon(entry.tier)}
                    <span className="font-rajdhani font-semibold text-lg text-white/90">{entry.username}</span>
                    <span className={`text-xs uppercase tracking-widest ${getTierColor(entry.tier)}`}>
                      {entry.tier}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-orbitron font-bold text-primary">
                    {entry.rating}
                  </div>
                  <div className="col-span-2 text-center font-mono text-sm">
                    <span className="text-green-400">{entry.wins}W</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-red-400">{entry.losses}L</span>
                  </div>
                  <div className="col-span-2 text-center font-mono font-bold text-white/80">
                    {entry.winRate}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</Button>
            <div className="flex items-center px-4 font-rajdhani">PAGE {page} OF {data.totalPages}</div>
            <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>NEXT</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
