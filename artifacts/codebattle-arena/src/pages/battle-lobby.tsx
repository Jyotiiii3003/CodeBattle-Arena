import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBattle, useJoinBattle } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Swords, KeyRound, Zap, Eye, Users, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface ActiveBattle {
  id: number;
  player1Username: string | null;
  player2Username: string | null;
  problemTitle: string | null;
  startTime: string | null;
  spectatorCount: number;
}

function useActiveBattles() {
  return useQuery<{ battles: ActiveBattle[] }>({
    queryKey: ["battles", "active"],
    queryFn: async () => {
      const res = await fetch("/api/battles/active");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

function formatDuration(startTime: string | null) {
  if (!startTime) return "—";
  const seconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BattleLobby() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [inviteCode, setInviteCode] = useState("");

  const createMutation = useCreateBattle();
  const joinMutation = useJoinBattle();
  const { data: activeBattlesData, refetch: refetchActive, isFetching } = useActiveBattles();
  const activeBattles = activeBattlesData?.battles ?? [];

  const handleCreate = () => {
    createMutation.mutate(
      { data: {} },
      {
        onSuccess: (data) => setLocation(`/battle/${data.id}`),
        onError: (error) => toast({ variant: "destructive", title: "Failed to create battle", description: error.message }),
      }
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    joinMutation.mutate(
      { data: { inviteCode } },
      {
        onSuccess: (data) => setLocation(`/battle/${data.id}`),
        onError: (error) => toast({ variant: "destructive", title: "Connection Failed", description: error.message || "Invalid invite code" }),
      }
    );
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center p-4 pt-12">

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-orbitron font-black tracking-widest text-shadow-neon-cyan mb-4 uppercase">
            BATTLE ARENA
          </h1>
          <p className="text-xl font-rajdhani text-muted-foreground max-w-lg mx-auto">
            Challenge opponents in real-time coding duels. Create a lobby or join an existing match.
          </p>
        </div>

        {/* Create / Join cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative">
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-white/10 items-center justify-center z-10 font-orbitron font-bold text-muted-foreground">
            VS
          </div>

          {/* Create */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 rounded-xl border-white/10 flex flex-col items-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 box-shadow-neon-cyan">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-orbitron font-bold mb-4">CREATE LOBBY</h2>
            <p className="text-muted-foreground font-rajdhani mb-8">
              Start a new match and invite an opponent via a unique code. A random problem will be selected.
            </p>
            <Button
              className="w-full h-14 bg-primary text-primary-foreground font-orbitron font-bold tracking-widest text-lg box-shadow-neon-cyan hover:bg-primary/90 mt-auto"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "INITIALIZING..." : "HOST MATCH"}
            </Button>
          </motion.div>

          {/* Join */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 rounded-xl border-white/10 flex flex-col items-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6 box-shadow-neon-purple">
              <KeyRound className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-orbitron font-bold mb-4">JOIN MATCH</h2>
            <p className="text-muted-foreground font-rajdhani mb-8">
              Enter an invite code provided by another player to join their battle arena.
            </p>
            <form onSubmit={handleJoin} className="w-full mt-auto flex flex-col gap-4">
              <Input
                placeholder="ENTER INVITE CODE"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="h-14 bg-black/50 border-white/10 focus-visible:border-secondary text-center font-mono text-xl tracking-widest uppercase"
              />
              <Button
                type="submit"
                className="w-full h-14 bg-secondary text-secondary-foreground font-orbitron font-bold tracking-widest text-lg box-shadow-neon-purple hover:bg-secondary/90"
                disabled={joinMutation.isPending || !inviteCode.trim()}
              >
                {joinMutation.isPending ? "CONNECTING..." : "ENTER ARENA"}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Watch Live Section */}
        <div className="w-full max-w-4xl mt-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-2xl font-orbitron font-bold tracking-widest">LIVE BATTLES</h2>
              {activeBattles.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  {activeBattles.length} ACTIVE
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchActive()}
              disabled={isFetching}
              className="text-muted-foreground hover:text-white font-rajdhani gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              REFRESH
            </Button>
          </div>

          {activeBattles.length === 0 ? (
            <div className="glass-panel rounded-xl border-white/10 p-12 text-center">
              <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="font-rajdhani text-muted-foreground text-lg">No live battles right now.</p>
              <p className="font-rajdhani text-muted-foreground/60 text-sm mt-1">Be the first to host a match!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeBattles.map((battle, i) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel rounded-xl border-white/10 px-6 py-4 flex items-center justify-between hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-6 min-w-0">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono text-red-400 font-bold">LIVE</span>
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-orbitron font-bold text-primary truncate max-w-[110px]">
                        {battle.player1Username ?? "???"}
                      </span>
                      <Swords className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-orbitron font-bold text-secondary truncate max-w-[110px]">
                        {battle.player2Username ?? "???"}
                      </span>
                    </div>

                    {/* Problem */}
                    {battle.problemTitle && (
                      <span className="hidden md:block text-sm font-rajdhani text-muted-foreground truncate max-w-[180px]">
                        {battle.problemTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    {/* Duration */}
                    <span className="hidden sm:block text-xs font-mono text-muted-foreground tabular-nums">
                      {formatDuration(battle.startTime)}
                    </span>

                    {/* Spectators */}
                    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{battle.spectatorCount}</span>
                    </div>

                    {/* Watch button */}
                    <Link href={`/spectate/${battle.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 hover:border-primary hover:text-primary font-orbitron text-xs tracking-widest gap-1.5 group-hover:border-primary/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        WATCH
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
