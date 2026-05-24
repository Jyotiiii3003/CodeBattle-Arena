import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetBattle, getGetBattleQueryKey, useGetProblem } from "@workspace/api-client-react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, Swords, Trophy, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { SubmissionInputLanguage } from "@workspace/api-client-react/src/generated/api.schemas";
import { useSubmitCode } from "@workspace/api-client-react";

export default function BattleRoom() {
  const [, params] = useRoute("/battle/:id");
  const battleId = parseInt(params?.id || "0");
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [battleState, setBattleState] = useState<any>(null);
  const [opponentStatus, setOpponentStatus] = useState<string>("Waiting...");
  
  const [language, setLanguage] = useState<SubmissionInputLanguage>("javascript");
  const [code, setCode] = useState<string>("");
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);

  // Poll battle until active
  const { data: battleData } = useGetBattle(battleId, {
    query: {
      enabled: !!battleId && (!battleState || battleState.status === 'waiting'),
      refetchInterval: (query) => query.state.data?.status === 'waiting' ? 2000 : false
    }
  });

  // Get problem details once we know the problemId
  const problemId = battleState?.problemId || battleData?.problemId;
  const { data: problem } = useGetProblem(problemId as number, {
    query: { enabled: !!problemId }
  });

  const submitMutation = useSubmitCode();

  useEffect(() => {
    if (battleData && !battleState) {
      setBattleState(battleData);
    }
  }, [battleData]);

  useEffect(() => {
    if (problem && problem.starterCode[language] && !code) {
      setCode(problem.starterCode[language]);
    }
  }, [problem, language]);

  // Socket setup
  useEffect(() => {
    if (!token || !battleId || !user) return;

    const newSocket = io(import.meta.env.BASE_URL || window.location.origin, {
      path: "/api/socket.io"
    });

    newSocket.on("connect", () => {
      newSocket.emit("joinRoom", { battleId, userId: user.id, token });
    });

    newSocket.on("battleStarted", (data) => {
      setBattleState(prev => ({ ...prev, ...data, status: 'active' }));
      toast({ title: "Battle Started!", description: "The arena is live." });
    });

    newSocket.on("opponentSubmitted", (data) => {
      if (data.userId !== user.id) {
        setOpponentStatus(data.verdict === 'pending' ? 'Judging...' : data.verdict.toUpperCase());
        if (data.verdict === 'accepted') {
          // If opponent accepted and we are not the winner, we lost
          setShowDefeat(true);
        }
      }
    });

    newSocket.on("battleEnded", (data) => {
      setBattleState(prev => ({ ...prev, ...data, status: 'finished' }));
      if (data.winnerId === user.id) {
        setShowVictory(true);
      } else if (data.winnerId && data.winnerId !== user.id) {
        setShowDefeat(true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [battleId, user, token, toast]);

  const handleCopyCode = () => {
    if (battleState?.inviteCode) {
      navigator.clipboard.writeText(battleState.inviteCode);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    }
  };

  const handleSubmit = () => {
    if (!code.trim() || !problemId) return;
    submitMutation.mutate({
      data: {
        problemId,
        battleId,
        language,
        code
      }
    });
  };

  const isWaiting = !battleState || battleState.status === 'waiting';
  const opponentName = battleState?.player1Id === user?.id 
    ? battleState?.player2Username 
    : battleState?.player1Username;

  if (isWaiting) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
          <div className="glass-panel p-12 rounded-xl border-white/10 text-center max-w-md w-full relative overflow-hidden box-shadow-neon-purple">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-3xl font-orbitron font-bold mb-2">WAITING FOR OPPONENT</h2>
              <p className="text-muted-foreground font-rajdhani mb-8 text-lg">Share this code to invite a challenger.</p>
              
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold tracking-widest text-secondary">{battleState?.inviteCode || '------'}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyCode} className="text-muted-foreground hover:text-secondary">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col p-4 max-w-[1800px] mx-auto gap-4">
        {/* HUD Header */}
        <div className="glass-panel h-20 rounded-xl border-white/10 flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">YOU</span>
              <span className="font-orbitron font-bold text-xl text-primary">{user?.username}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-muted-foreground" />
              <span className="font-rajdhani font-bold text-xl tracking-widest">VS</span>
              <Swords className="w-6 h-6 text-muted-foreground" />
            </div>
            {showVictory && <span className="text-green-400 font-orbitron font-bold text-sm animate-pulse-glow px-2 rounded">VICTORY</span>}
            {showDefeat && <span className="text-red-400 font-orbitron font-bold text-sm animate-pulse-glow-error px-2 rounded">DEFEAT</span>}
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="flex flex-col">
              <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">OPPONENT</span>
              <span className="font-orbitron font-bold text-xl text-secondary">{opponentName || "Unknown"}</span>
              <span className="text-xs font-mono text-secondary/70">{opponentStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 h-[calc(100%-6rem)]">
          {/* Problem Area */}
          <div className="flex-1 glass-panel rounded-xl border-white/10 p-6 overflow-y-auto">
            {problem ? (
              <>
                <h1 className="text-2xl font-rajdhani font-bold tracking-wide mb-6">{problem.title}</h1>
                <div className="prose prose-invert max-w-none prose-p:font-rajdhani" dangerouslySetInnerHTML={{ __html: problem.description }} />
              </>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden relative">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{ fontFamily: 'JetBrains Mono', fontSize: 14, minimap: { enabled: false } }}
              />
            </div>
            <Button 
              className="h-14 w-full bg-primary text-primary-foreground font-orbitron font-bold tracking-widest text-lg box-shadow-neon-cyan hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || battleState?.status === 'finished'}
            >
              SUBMIT SOLUTION
            </Button>
          </div>
        </div>
      </div>

      {/* Victory Overlay */}
      <AnimatePresence>
        {showVictory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <Trophy className="w-32 h-32 text-primary mx-auto mb-8 animate-pulse-glow rounded-full bg-primary/10 p-4" />
              <h1 className="text-7xl font-orbitron font-black text-primary text-shadow-neon-cyan mb-4 uppercase">VICTORY</h1>
              <p className="text-2xl font-rajdhani text-white/80">You have defeated your opponent.</p>
              <Button className="mt-8 bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani" onClick={() => window.location.href = '/'}>
                RETURN TO LOBBY
              </Button>
            </motion.div>
          </motion.div>
        )}

        {showDefeat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <AlertTriangle className="w-32 h-32 text-destructive mx-auto mb-8 animate-pulse-glow-error rounded-full bg-destructive/10 p-4" />
              <h1 className="text-7xl font-orbitron font-black text-destructive text-shadow-neon-purple mb-4 uppercase">DEFEAT</h1>
              <p className="text-2xl font-rajdhani text-white/80">Your opponent was faster.</p>
              <Button className="mt-8 bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani" onClick={() => window.location.href = '/'}>
                RETURN TO LOBBY
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
