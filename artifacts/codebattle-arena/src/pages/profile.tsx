import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useGetUserProfile, useGetUserSubmissions, useGetUserBattles } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Swords, TerminalSquare, CalendarDays, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username || "";

  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile(username);
  const { data: submissions, isLoading: isSubmissionsLoading } = useGetUserSubmissions(username);
  const { data: battles, isLoading: isBattlesLoading } = useGetUserBattles(username);

  if (isProfileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-orbitron text-muted-foreground">CONTENDER NOT FOUND</h1>
        </div>
      </Layout>
    );
  }

  const winRate = profile.wins + profile.losses > 0 
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) 
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Profile Header */}
        <div className="glass-panel rounded-xl border-white/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full blur-[50px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 bg-black border border-white/10 rounded-2xl flex items-center justify-center box-shadow-neon-cyan rotate-3">
              <span className="font-orbitron text-5xl font-bold text-primary">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                <h1 className="text-4xl font-orbitron font-bold tracking-wider text-white">
                  {profile.username}
                </h1>
                <Badge variant="outline" className="font-rajdhani text-sm px-3 py-1 border-primary/50 text-primary bg-primary/10">
                  {profile.rank.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-rajdhani text-lg mb-6">
                <CalendarDays className="w-5 h-5" />
                <span>Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="RATING" value={profile.rating} icon={<Activity className="w-4 h-4 text-primary" />} />
                <StatBox label="WIN RATE" value={`${winRate}%`} icon={<Trophy className="w-4 h-4 text-secondary" />} />
                <StatBox label="BATTLES" value={profile.wins + profile.losses} icon={<Swords className="w-4 h-4 text-primary" />} />
                <StatBox label="SOLVED" value={profile.solvedCount} icon={<TerminalSquare className="w-4 h-4 text-secondary" />} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Battles */}
          <div className="glass-panel rounded-xl border-white/10 p-6 flex flex-col h-[500px]">
            <h2 className="text-2xl font-orbitron font-bold mb-6 flex items-center gap-2">
              <Swords className="w-6 h-6 text-secondary" />
              RECENT BATTLES
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isBattlesLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : battles?.length === 0 ? (
                <p className="text-muted-foreground font-rajdhani">No battles fought yet.</p>
              ) : (
                battles?.map(battle => {
                  const isWinner = battle.winnerId === profile.id;
                  const opponent = battle.player1Username === profile.username ? battle.player2Username : battle.player1Username;
                  return (
                    <div key={battle.id} className="bg-black/40 border border-white/10 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-rajdhani font-bold mb-1 truncate max-w-[200px]">{battle.problemTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">vs {opponent}</div>
                      </div>
                      <Badge variant="outline" className={isWinner ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"}>
                        {isWinner ? "VICTORY" : "DEFEAT"}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="glass-panel rounded-xl border-white/10 p-6 flex flex-col h-[500px]">
            <h2 className="text-2xl font-orbitron font-bold mb-6 flex items-center gap-2">
              <TerminalSquare className="w-6 h-6 text-primary" />
              RECENT SUBMISSIONS
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isSubmissionsLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : submissions?.length === 0 ? (
                <p className="text-muted-foreground font-rajdhani">No submissions yet.</p>
              ) : (
                submissions?.map(sub => (
                  <div key={sub.id} className="bg-black/40 border border-white/10 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-rajdhani font-bold mb-1">Problem #{sub.problemId}</div>
                      <div className="flex gap-2 text-xs font-mono">
                        <span className="text-muted-foreground">{sub.language}</span>
                        <span className="text-muted-foreground">{format(new Date(sub.createdAt), "MMM d")}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={sub.verdict === 'accepted' ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"}>
                      {sub.verdict === 'accepted' ? 'AC' : 'WA'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-center flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-rajdhani tracking-widest font-bold mb-2">
        {icon}
        {label}
      </div>
      <div className="font-orbitron font-bold text-2xl text-white">{value}</div>
    </div>
  );
}
