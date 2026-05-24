import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useGetStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Swords, Trophy, Users, Zap, TerminalSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetStats();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-rajdhani font-medium text-secondary mb-6 box-shadow-neon-purple">
              <Zap className="w-4 h-4" />
              <span>THE ULTIMATE CODING ARENA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-orbitron font-black tracking-tight mb-6 uppercase">
              Prove Your <span className="text-primary text-shadow-neon-cyan">Worth</span><br/>
              In The <span className="text-secondary text-shadow-neon-purple">Arena</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-rajdhani">
              Real-time competitive programming. Head-to-head battles. 
              Climb the ranks and become an undisputed coding legend.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 box-shadow-neon-cyan font-orbitron font-bold tracking-wide" asChild>
                <Link href="/battle">ENTER BATTLE</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 hover:bg-white/5 font-orbitron font-bold tracking-wide" asChild>
                <Link href="/problems">TRAIN FIRST</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/10 bg-black/40 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard 
              icon={<Users className="w-6 h-6 text-primary" />} 
              label="ELITE CODERS" 
              value={isLoading ? null : stats?.totalUsers.toLocaleString()} 
            />
            <StatCard 
              icon={<Swords className="w-6 h-6 text-secondary" />} 
              label="BATTLES FOUGHT" 
              value={isLoading ? null : stats?.totalBattles.toLocaleString()} 
            />
            <StatCard 
              icon={<TerminalSquare className="w-6 h-6 text-primary" />} 
              label="SUBMISSIONS" 
              value={isLoading ? null : stats?.totalSubmissions.toLocaleString()} 
            />
            <StatCard 
              icon={<Trophy className="w-6 h-6 text-secondary" />} 
              label="PROBLEMS" 
              value={isLoading ? null : stats?.totalProblems.toLocaleString()} 
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold tracking-wider mb-4">FEATURES</h2>
            <p className="text-muted-foreground font-rajdhani text-lg">Everything you need to dominate the competition.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Swords className="w-10 h-10 text-primary" />}
              title="LIVE BATTLES"
              description="Challenge opponents in real-time. See their progress as you code. The fastest to solve wins."
            />
            <FeatureCard 
              icon={<Trophy className="w-10 h-10 text-secondary" />}
              title="ELO RANKING"
              description="Climb the global leaderboard. Earn tier badges from Beginner up to the legendary Expert rank."
            />
            <FeatureCard 
              icon={<TerminalSquare className="w-10 h-10 text-primary" />}
              title="PREMIUM EDITOR"
              description="Code comfortably with an embedded Monaco editor supporting C++, Java, Python, and JavaScript."
            />
          </div>
        </div>
      </section>
      
    </Layout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 p-3 rounded-full bg-white/5 border border-white/10">
        {icon}
      </div>
      {value ? (
        <div className="text-3xl md:text-4xl font-orbitron font-bold mb-2">{value}</div>
      ) : (
        <Skeleton className="h-10 w-24 mb-2 bg-white/10" />
      )}
      <div className="text-sm font-rajdhani font-semibold text-muted-foreground tracking-widest">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-8 rounded-xl flex flex-col items-start border-white/10 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-orbitron font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground font-rajdhani leading-relaxed">{description}</p>
    </motion.div>
  );
}
