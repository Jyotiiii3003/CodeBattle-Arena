import { useEffect, useState, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetBattle, useGetProblem } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { io, Socket } from "socket.io-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { Eye, Swords, Trophy, Send, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerCodeState {
  code: string;
  language: string;
  lastVerdict?: string;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  ts: number;
  role: "spectator" | "player" | "system";
}

export default function Spectate() {
  const [, params] = useRoute("/spectate/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const battleId = parseInt(params?.id || "0");

  const [spectatorCount, setSpectatorCount] = useState(0);
  const [winner, setWinner] = useState<{ id: number; username: string } | null>(null);
  const [playerCodes, setPlayerCodes] = useState<Map<number, PlayerCodeState>>(new Map());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatName, setChatName] = useState<string>("");
  const [nameSet, setNameSet] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: battleData } = useGetBattle(battleId, { query: { enabled: !!battleId } });
  const problemId = battleData?.problemId;
  const { data: problem } = useGetProblem(problemId as number, { query: { enabled: !!problemId } });

  const player1Id = battleData?.player1Id;
  const player2Id = battleData?.player2Id;
  const player1Username = battleData?.player1Username ?? "Player 1";
  const player2Username = battleData?.player2Username ?? "Player 2";

  const player1Code = player1Id ? playerCodes.get(player1Id) : undefined;
  const player2Code = player2Id ? playerCodes.get(player2Id) : undefined;

  // Pre-fill chat name from logged-in user
  useEffect(() => {
    if (user?.username && !nameSet) {
      setChatName(user.username);
      setNameSet(true);
    }
  }, [user, nameSet]);

  const connectSocket = useCallback((displayName: string) => {
    if (socketRef.current) return;

    const newSocket = io(window.location.origin, { path: "/ws/socket.io" });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      newSocket.emit("spectate", { battleId, username: displayName });
    });

    newSocket.on("spectating", (data: { spectatorCount: number }) => {
      setSpectatorCount(data.spectatorCount);
    });

    newSocket.on("chatHistory", (data: { messages: ChatMessage[] }) => {
      setMessages(data.messages);
    });

    newSocket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("codeUpdate", (data: { userId: number; code: string; language: string }) => {
      setPlayerCodes((prev) => {
        const next = new Map(prev);
        next.set(data.userId, { code: data.code, language: data.language, lastVerdict: prev.get(data.userId)?.lastVerdict });
        return next;
      });
    });

    newSocket.on("opponentSubmitted", (data: { userId: number; verdict: string }) => {
      setPlayerCodes((prev) => {
        const next = new Map(prev);
        const ex = next.get(data.userId);
        next.set(data.userId, { code: ex?.code ?? "", language: ex?.language ?? "javascript", lastVerdict: data.verdict });
        return next;
      });
    });

    newSocket.on("spectatorCount", (data: { count: number }) => {
      setSpectatorCount(data.count);
    });

    newSocket.on("battleEnded", (data: { winnerId: number; winnerUsername: string }) => {
      setWinner({ id: data.winnerId, username: data.winnerUsername });
    });
  }, [battleId]);

  // Auto-connect if user is logged in
  useEffect(() => {
    if (!battleId) return;
    if (user?.username) {
      setChatName(user.username);
      setNameSet(true);
      connectSocket(user.username);
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [battleId, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = chatName.trim() || "Guest";
    setChatName(name);
    setNameSet(true);
    connectSocket(name);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit("chat:send", {
      battleId,
      username: chatName,
      text,
      role: "spectator",
    });
    setChatInput("");
  };

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return "text-muted-foreground";
    if (verdict === "accepted") return "text-green-400";
    if (verdict === "wrong_answer") return "text-red-400";
    return "text-yellow-400";
  };

  const getVerdictLabel = (verdict?: string) =>
    verdict ? verdict.replace(/_/g, " ").toUpperCase() : "No submission";

  const getMsgStyle = (role: string) => {
    if (role === "system") return "text-yellow-400/80 italic text-xs";
    if (role === "player") return "text-primary";
    return "text-white/90";
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col p-4 max-w-[1920px] mx-auto gap-4">

        {/* HUD Header */}
        <div className="glass-panel h-20 rounded-xl border-white/10 flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

          <div className="flex flex-col min-w-[160px]">
            <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">PLAYER 1</span>
            <span className="font-orbitron font-bold text-xl text-primary">{player1Username}</span>
            <span className={`text-xs font-mono ${getVerdictColor(player1Code?.lastVerdict)}`}>
              {getVerdictLabel(player1Code?.lastVerdict)}
            </span>
          </div>

          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 gap-1">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-muted-foreground" />
              <span className="font-rajdhani font-bold text-xl tracking-widest">LIVE MATCH</span>
              <Swords className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{spectatorCount} watching</span>
              {problem && <span className="text-secondary/70 truncate max-w-[180px]">{problem.title}</span>}
            </div>
          </div>

          <div className="flex flex-col min-w-[160px] text-right">
            <span className="text-xs font-rajdhani font-bold text-muted-foreground tracking-widest">PLAYER 2</span>
            <span className="font-orbitron font-bold text-xl text-secondary">{player2Username}</span>
            <span className={`text-xs font-mono ${getVerdictColor(player2Code?.lastVerdict)}`}>
              {getVerdictLabel(player2Code?.lastVerdict)}
            </span>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Problem panel */}
          <div className="w-[280px] shrink-0 glass-panel rounded-xl border-white/10 p-5 overflow-y-auto hidden lg:block">
            {problem ? (
              <>
                <h2 className="text-base font-rajdhani font-bold tracking-wide mb-1">{problem.title}</h2>
                <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded mb-4 inline-block ${
                  problem.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                  problem.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{problem.difficulty}</span>
                <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed">{problem.description}</p>
                {Array.isArray(problem.examples) && problem.examples.length > 0 && (
                  <div className="mt-4 space-y-2">
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
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
              </div>
            )}
          </div>

          {/* Dual editors */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            {/* Player 1 */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border-white/10 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-orbitron text-sm font-bold text-primary">{player1Username}</span>
                {player1Code?.language && (
                  <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">{player1Code.language}</span>
                )}
              </div>
              <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden">
                <Editor
                  height="100%"
                  language={player1Code?.language ?? "javascript"}
                  theme="vs-dark"
                  value={player1Code?.code ?? "// Waiting for player to start coding..."}
                  options={{ readOnly: true, fontFamily: "JetBrains Mono", fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, renderLineHighlight: "none" }}
                />
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border-white/10 shrink-0">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-orbitron text-sm font-bold text-secondary">{player2Username}</span>
                {player2Code?.language && (
                  <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">{player2Code.language}</span>
                )}
              </div>
              <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden">
                <Editor
                  height="100%"
                  language={player2Code?.language ?? "javascript"}
                  theme="vs-dark"
                  value={player2Code?.code ?? "// Waiting for player to start coding..."}
                  options={{ readOnly: true, fontFamily: "JetBrains Mono", fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, renderLineHighlight: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="w-[280px] shrink-0 flex flex-col glass-panel rounded-xl border-white/10 overflow-hidden">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
              <MessageSquare className="w-4 h-4 text-secondary" />
              <span className="font-orbitron text-sm font-bold tracking-widest">LIVE CHAT</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Name gate */}
            {!nameSet && !user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Eye className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
                <p className="text-sm font-rajdhani text-muted-foreground text-center mb-4">Enter a name to join the chat</p>
                <form onSubmit={handleNameSubmit} className="w-full space-y-3">
                  <Input
                    placeholder="YOUR NAME"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    maxLength={24}
                    className="h-10 bg-black/50 border-white/10 focus-visible:border-secondary text-center font-mono tracking-widest uppercase text-sm"
                    autoFocus
                  />
                  <Button type="submit" className="w-full h-10 bg-secondary text-secondary-foreground font-orbitron text-xs tracking-widest">
                    JOIN CHAT
                  </Button>
                </form>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 font-rajdhani text-center mt-4">No messages yet. Say something!</p>
                  )}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      {msg.role === "system" ? (
                        <p className="text-xs text-yellow-400/70 italic text-center py-0.5">{msg.text}</p>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs font-bold font-rajdhani ${msg.role === "player" ? "text-primary" : "text-secondary/80"}`}>
                            {msg.username}
                            <span className="text-muted-foreground/40 font-normal ml-1.5 font-mono text-[10px]">
                              {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </span>
                          <p className="text-xs text-white/80 font-rajdhani break-words leading-relaxed">{msg.text}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-white/10 shrink-0">
                  <Input
                    placeholder="Say something..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    maxLength={300}
                    className="flex-1 h-9 bg-black/50 border-white/10 focus-visible:border-secondary text-xs font-rajdhani"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!chatInput.trim()}
                    className="h-9 w-9 shrink-0 bg-secondary hover:bg-secondary/90"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </>
            )}
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
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="text-center">
              <Trophy className="w-24 h-24 text-primary mx-auto mb-6 rounded-full bg-primary/10 p-4" />
              <p className="text-lg font-rajdhani text-muted-foreground mb-2 tracking-widest uppercase">Winner</p>
              <h1 className="text-6xl font-orbitron font-black text-primary text-shadow-neon-cyan mb-2">{winner.username}</h1>
              <p className="text-xl font-rajdhani text-white/60 mb-8">solved the problem first</p>
              <div className="flex gap-4 justify-center">
                <Button className="bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani" onClick={() => setLocation("/battle")}>
                  <Swords className="w-4 h-4 mr-2" />FIND A BATTLE
                </Button>
                <Button className="bg-white/10 border border-white/20 hover:bg-white/20 font-rajdhani" onClick={() => setLocation("/")}>HOME</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
