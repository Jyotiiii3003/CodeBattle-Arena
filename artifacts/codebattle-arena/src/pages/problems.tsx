import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListProblems } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronRight, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListProblemsDifficulty } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Problems() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListProblems({
    search: search || undefined,
    difficulty: difficulty !== "all" ? difficulty as ListProblemsDifficulty : undefined,
    page,
    limit: 20
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy": return "text-green-400 border-green-400/20 bg-green-400/10";
      case "medium": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "hard": return "text-red-400 border-red-400/20 bg-red-400/10";
      default: return "text-muted-foreground border-white/10 bg-white/5";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-140px)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-orbitron font-bold tracking-wider mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              TRAINING ARENA
            </h1>
            <p className="text-muted-foreground font-rajdhani text-lg">Sharpen your skills before entering the battle.</p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search problems..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/50 border-white/10 focus-visible:border-primary font-mono h-11"
              />
            </div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/10 h-11 font-rajdhani font-semibold tracking-wide">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-panel rounded-xl border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 font-rajdhani font-bold tracking-wider text-muted-foreground text-sm">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">TITLE</div>
            <div className="col-span-2 text-center">DIFFICULTY</div>
            <div className="col-span-2 text-center">SOLVED BY</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-1 flex justify-center"><Skeleton className="h-5 w-5 bg-white/10" /></div>
                  <div className="col-span-6"><Skeleton className="h-6 w-48 bg-white/10" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-16 bg-white/10" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-5 w-12 bg-white/10" /></div>
                  <div className="col-span-1"></div>
                </div>
              ))
            ) : data?.problems.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-rajdhani text-lg">
                No problems found matching your criteria.
              </div>
            ) : (
              data?.problems.map((problem, idx) => (
                <motion.div 
                  key={problem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 cursor-pointer transition-colors group"
                  onClick={() => setLocation(`/problems/${problem.id}`)}
                >
                  <div className="col-span-1 text-center font-mono text-muted-foreground/50 group-hover:text-primary transition-colors">
                    {problem.id}
                  </div>
                  <div className="col-span-6">
                    <div className="font-rajdhani font-semibold text-lg group-hover:text-primary transition-colors truncate">
                      {problem.title}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Badge variant="outline" className={`font-rajdhani tracking-widest ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-center font-mono text-sm text-muted-foreground">
                    {problem.solvedBy.toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="group-hover:bg-primary/20 group-hover:text-primary">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button 
              variant="outline" 
              className="border-white/10 hover:bg-white/10"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              PREVIOUS
            </Button>
            <div className="flex items-center px-4 font-rajdhani font-semibold">
              PAGE {page} OF {data.totalPages}
            </div>
            <Button 
              variant="outline" 
              className="border-white/10 hover:bg-white/10"
              disabled={page === data.totalPages}
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            >
              NEXT
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
