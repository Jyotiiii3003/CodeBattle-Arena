import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetBattle, useGetProblem } from "@workspace/api-client-react";
import { io, Socket } from "socket.io-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { Eye, Swords, Trophy, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerCodeState {
  code: string;
  language: string;
  lastVerdict?: string;
}

export default function Spectate() {
  const [, params] = useRoute("/spectate/:id");
  const [, setLocation] = useLocation();
  const battleId = parseInt(params?.id || "0");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [battleStatus, setBattleStatus] = useState<string>("active");
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [winner, setWinner] = useState<{ id: number; username: string } | null>(null);
  const [playerCodes, setPlayerCodes] = useState<Map<number, PlayerCodeState>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const { data: battleData } = useGetBattle(battleId, {
    query: { enabled: !!battleId },
  });

  const problemId = battleData?.problemId;
  const { data: problem } = useGetProblem(problemId as number, {
    query: { enabled: !!problemId },
  });

  const player1Id = battleData?.player1Id;
  const player2Id = battleData?.player2Id;
  const player1Username = battleData?.player1Username ?? "Player 1";
  const player2Username = battleData?.player2Username ?? "Player 2";

  const player1Code = player1Id ? playerCodes.get(player1Id) : undefined;
  const player2Code = player2Id ? playerCodes.get(player2Id) : undefined;

  useEffect(() => {
    if (!battleId) return;

    const newSocket = io(window.location.origin, {
      path: "/ws/socket.io",
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("spectate", { battleId, username: "Spectator" });
    });

    newSocket.on("spectating", (data: { battleId: number; status: string; spectatorCount: number }) => {
      setBattleStatus(data.status);
      setSpectatorCount(data.spectatorCount);
    });

    newSocket.on("codeUpdate", (data: { userId: number; code: string; language: string }) => {
      setPlayerCodes((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          code: data.code,
          language: data.language,
          lastVerdict: prev.get(data.userId)?.lastVerdict,
        });
        return next;
      });
    });

    newSocket.on("opponentSubmitted", (data: { userId: number; verdict: string }) => {
      setPlayerCodes((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) {
          next.set(data.userId, { ...existing, lastVerdict: data.verdict });
        } else {
          next.set(data.userId, { code: "", language: "javascript", lastVerdict: data.verdict });
        }
        return next;
      });
    });

    newSocket.on("spectatorCount", (data: { count: number }) => {
      setSpectatorCount(data.count);
    });

    newSocket.on("battleEnded", (data: { winnerId: number; winnerUsername: string }) => {
      setBattleStatus("finished");
      setWinner({ id: data.winnerId, username: data.winnerUsername });
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Spectate error:", data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [battleId]);

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return "text-muted-foreground";
    if (verdict === "accepted") return "text-green-400";
    if (verdict === "wrong_answer") return "text-red-400";
    return "text-yellow-400";
  };

  const getVerdictLabel = (verdict?: string) => {
    if (!verdict) return "No submission";
    return verdict.replace(/_/g, " ").toUpperCase();
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col p-4 max-w-[1800px] mx-auto gap-4">

        {/* HUD Header */}
        <div className="glass-panel h-20 rounded-xl border-white/10 flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

          {/* Player 1 */}
          <div className="flex items-center gap-3 min-w-[160px]">
            <div className="flex flex-col">
              <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">PLAYER 1</span>
              <span className="font-orbitron font-bold text-xl text-primary">{player1Username}</span>
              <span className={`text-xs font-mono ${getVerdictColor(player1Code?.lastVerdict)}`}>
                {getVerdictLabel(player1Code?.lastVerdict)}
              </span>
            </div>
          </div>

          {/* Center: VS + Spectator count */}
          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 gap-1">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-muted-foreground" />
              <span className="font-rajdhani font-bold text-xl tracking-widest">LIVE MATCH</span>
              <Swords className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-rajdhani text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{spectatorCount} watching</span>
            </div>
            {problem && (
              <span className="text-xs font-mono text-secondary/70 truncate max-w-[200px]">{problem.title}</span>
            )}
          </div>

          {/* Player 2 */}
          <div className="flex items-center gap-3 min-w-[160px] justify-end text-right">
            <div className="flex flex-col">
              <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">PLAYER 2</span>
              <span className="font-orbitron font-bold text-xl text-secondary">{player2Username}</span>
              <span className={`text-xs font-mono ${getVerdictColor(player2Code?.lastVerdict)}`}>
                {getVerdictLabel(player2Code?.lastVerdict)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Problem Panel */}
          <div className="w-full lg:w-[320px] shrink-0 glass-panel rounded-xl border-white/10 p-6 overflow-y-auto">
            {problem ? (
              <>
                <h2 className="text-lg font-rajdhani font-bold tracking-wide mb-1">{problem.title}</h2>
                <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded mb-4 inline-block ${
                  problem.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                  problem.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{problem.difficulty}</span>
                <div className="prose prose-invert max-w-none prose-p:font-rajdhani prose-p:text-sm text-sm text-muted-foreground">
                  <p>{problem.description}</p>
                </div>
                {Array.isArray(problem.examples) && problem.examples.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">EXAMPLES</p>
                    {(problem.examples as Array<{ input: string; output: string; explanation?: string }>).map((ex, i) => (
                      <div key={i} className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono space-y-1">
                        <p><span className="text-primary/70">Input:</span> {ex.input}</p>
                        <p><span className="text-secondary/70">Output:</span> {ex.output}</p>
                        {ex.explanation && <p className="text-muted-foreground">{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            )}
          </div>

          {/* Dual Editor Panels */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            {/* Player 1 Editor */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border-white/10 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-orbitron text-sm font-bold text-primary">{player1Username}</span>
                {player1Code?.language && (
                  <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">{player1Code.language}</span>
                )}
              </div>
              <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden min-h-0">
                <Editor
                  height="100%"
                  language={player1Code?.language ?? "javascript"}
                  theme="vs-dark"
                  value={player1Code?.code ?? "// Waiting for player to start coding..."}
                  options={{
                    readOnly: true,
                    fontFamily: "JetBrains Mono",
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: "none",
                    cursorStyle: "line",
                  }}
                />
              </div>
            </div>

            {/* Player 2 Editor */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border-white/10 shrink-0">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-orbitron text-sm font-bold text-secondary">{player2Username}</span>
                {player2Code?.language && (
                  <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">{player2Code.language}</span>
                )}
              </div>
              <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden min-h-0">
                <Editor
                  height="100%"
                  language={player2Code?.language ?? "javascript"}
                  theme="vs-dark"
                  value={player2Code?.code ?? "// Waiting for player to start coding..."}
                  options={{
                    readOnly: true,
                    fontFamily: "JetBrains Mono",
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: "none",
                    cursorStyle: "line",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Ended Overlay */}
      <AnimatePresence>
        {winner && (
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
              <Trophy className="w-24 h-24 text-primary mx-auto mb-6 rounded-full bg-primary/10 p-4" />
              <p className="text-lg font-rajdhani text-muted-foreground mb-2 tracking-widest uppercase">Winner</p>
              <h1 className="text-6xl font-orbitron font-black text-primary text-shadow-neon-cyan mb-2">
                {winner.username}
              </h1>
              <p className="text-xl font-rajdhani text-white/60 mb-8">solved the problem first</p>
              <div className="flex gap-4 justify-center">
                <Button
                  className="bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani"
                  onClick={() => setLocation("/battle")}
                >
                  <Swords className="w-4 h-4 mr-2" />
                  FIND A BATTLE
                </Button>
                <Button
                  className="bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani"
                  onClick={() => setLocation("/")}
                >
                  HOME
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
