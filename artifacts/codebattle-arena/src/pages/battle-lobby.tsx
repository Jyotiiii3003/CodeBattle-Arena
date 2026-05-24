import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBattle, useJoinBattle } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Swords, Users, KeyRound, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function BattleLobby() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState("");
  
  const createMutation = useCreateBattle();
  const joinMutation = useJoinBattle();

  const handleCreate = () => {
    createMutation.mutate(
      { data: {} },
      {
        onSuccess: (data) => {
          setLocation(`/battle/${data.id}`);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to create battle",
            description: error.message
          });
        }
      }
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    joinMutation.mutate(
      { data: { inviteCode } },
      {
        onSuccess: (data) => {
          setLocation(`/battle/${data.id}`);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: error.message || "Invalid invite code"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-orbitron font-black tracking-widest text-shadow-neon-cyan mb-4 uppercase">
            BATTLE ARENA
          </h1>
          <p className="text-xl font-rajdhani text-muted-foreground max-w-lg mx-auto">
            Challenge opponents in real-time coding duels. Create a lobby or join an existing match.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative">
          {/* VS Divider */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-white/10 items-center justify-center z-10 font-orbitron font-bold text-muted-foreground">
            VS
          </div>
          
          {/* Create Battle Card */}
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

          {/* Join Battle Card */}
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
      </div>
    </Layout>
  );
}
