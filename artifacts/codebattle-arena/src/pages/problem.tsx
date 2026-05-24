import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  useGetProblem, 
  getGetProblemQueryKey,
  useSubmitCode,
  useGetSubmission
} from "@workspace/api-client-react";
import Editor from "@monaco-editor/react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Play, Send, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { SubmissionInputLanguage } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Problem() {
  const [, params] = useRoute("/problems/:id");
  const problemId = parseInt(params?.id || "0");
  const { user } = useAuth();
  
  const [language, setLanguage] = useState<SubmissionInputLanguage>("javascript");
  const [code, setCode] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const { data: problem, isLoading } = useGetProblem(problemId, {
    query: {
      enabled: !!problemId,
      queryKey: getGetProblemQueryKey(problemId)
    }
  });

  const submitMutation = useSubmitCode();
  
  const { data: submission, isFetching: isPolling } = useGetSubmission(submissionId || 0, {
    query: {
      enabled: !!submissionId,
      refetchInterval: (query) => {
        if (!query.state.data) return 1000;
        const state = query.state.data.verdict;
        return state === 'pending' ? 1000 : false;
      }
    }
  });

  useEffect(() => {
    if (problem && problem.starterCode[language]) {
      setCode(problem.starterCode[language]);
    }
  }, [problem, language]);

  const handleSubmit = () => {
    if (!code.trim() || !user) return;
    
    submitMutation.mutate({
      data: {
        problemId,
        language,
        code
      }
    }, {
      onSuccess: (data) => {
        setSubmissionId(data.id);
      }
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case "easy": return "text-green-400 border-green-400/20 bg-green-400/10";
      case "medium": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "hard": return "text-red-400 border-red-400/20 bg-red-400/10";
      default: return "text-muted-foreground border-white/10 bg-white/5";
    }
  };

  const getVerdictDisplay = () => {
    if (!submission) return null;
    
    switch (submission.verdict) {
      case 'accepted':
        return (
          <div className="flex items-center gap-2 text-green-400 animate-pulse-glow px-4 py-2 rounded-lg bg-green-400/10 border border-green-400/20">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-orbitron font-bold tracking-wider">ACCEPTED</span>
            <span className="text-xs font-mono ml-2 text-green-400/70">{submission.executionTime}ms</span>
          </div>
        );
      case 'wrong_answer':
        return (
          <div className="flex items-center gap-2 text-red-400 animate-pulse-glow-error px-4 py-2 rounded-lg bg-red-400/10 border border-red-400/20">
            <XCircle className="w-5 h-5" />
            <span className="font-orbitron font-bold tracking-wider">WRONG ANSWER</span>
          </div>
        );
      case 'time_limit_exceeded':
        return (
          <div className="flex items-center gap-2 text-yellow-400 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
            <Clock className="w-5 h-5" />
            <span className="font-orbitron font-bold tracking-wider">TIME LIMIT EXCEEDED</span>
          </div>
        );
      case 'compilation_error':
      case 'runtime_error':
        return (
          <div className="flex items-center gap-2 text-orange-400 px-4 py-2 rounded-lg bg-orange-400/10 border border-orange-400/20">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-orbitron font-bold tracking-wider">
              {submission.verdict === 'compilation_error' ? 'COMPILATION ERROR' : 'RUNTIME ERROR'}
            </span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 text-primary px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-orbitron font-bold tracking-wider">JUDGING...</span>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 p-4 max-w-[1800px] mx-auto">
        {/* Left Panel - Problem Description */}
        <div className="flex-1 flex flex-col glass-panel rounded-xl border-white/10 overflow-hidden h-full min-h-[400px] md:w-1/2">
          {isLoading || !problem ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-3/4 bg-white/10" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-white/10" />
                <Skeleton className="h-6 w-20 bg-white/10" />
              </div>
              <Skeleton className="h-32 w-full mt-8 bg-white/10" />
              <Skeleton className="h-32 w-full mt-4 bg-white/10" />
            </div>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl md:text-3xl font-rajdhani font-bold tracking-wide">
                    {problem.id}. {problem.title}
                  </h1>
                  <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                    {problem.difficulty.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {problem.tags.map(tag => (
                    <span key={tag} className="text-xs font-mono text-muted-foreground bg-white/5 border border-white/10 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="prose prose-invert max-w-none prose-p:font-rajdhani prose-p:text-lg prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:font-rajdhani"
                     dangerouslySetInnerHTML={{ __html: problem.description }} 
                />
                
                {problem.examples && problem.examples.length > 0 && (
                  <div className="mt-10 space-y-6">
                    <h3 className="text-xl font-rajdhani font-bold text-white/90">Examples</h3>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm space-y-3">
                        <div>
                          <span className="text-muted-foreground font-rajdhani tracking-wider block mb-1">INPUT:</span>
                          <span className="text-white/90 whitespace-pre-wrap">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-rajdhani tracking-wider block mb-1">OUTPUT:</span>
                          <span className="text-primary whitespace-pre-wrap">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="pt-2 mt-2 border-t border-white/10">
                            <span className="text-muted-foreground font-rajdhani tracking-wider block mb-1">EXPLANATION:</span>
                            <span className="text-white/70 font-rajdhani font-medium">{ex.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {problem.constraints && (
                  <div className="mt-10">
                    <h3 className="text-xl font-rajdhani font-bold text-white/90 mb-4">Constraints</h3>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm text-secondary/90 whitespace-pre-wrap">
                      {problem.constraints}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right Panel - Editor & Controls */}
        <div className="flex-1 flex flex-col gap-4 h-full md:w-1/2">
          {/* Controls Bar */}
          <div className="glass-panel h-14 rounded-xl border-white/10 flex items-center justify-between px-4 shrink-0">
            <Select value={language} onValueChange={(v) => setLanguage(v as SubmissionInputLanguage)}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/10 h-9 font-rajdhani font-semibold">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10">
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="h-9 border-white/10 font-rajdhani font-bold tracking-wider hover:bg-white/5 hover:text-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                RUN CODE
              </Button>
              <Button 
                className="h-9 bg-primary text-primary-foreground font-orbitron font-bold tracking-widest box-shadow-neon-cyan hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || (submission?.verdict === 'pending')}
              >
                <Send className="w-4 h-4 mr-2" />
                SUBMIT
              </Button>
            </div>
          </div>
          
          {/* Editor Container */}
          <div className="flex-1 glass-panel rounded-xl border-white/10 overflow-hidden relative">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                fontFamily: 'JetBrains Mono',
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineHeight: 1.5,
              }}
              loading={<div className="flex h-full items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>}
            />
          </div>
          
          {/* Verdict/Console Output */}
          <AnimatePresence>
            {submission && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="glass-panel rounded-xl border-white/10 p-4 shrink-0"
              >
                <div className="flex items-center justify-between mb-2">
                  {getVerdictDisplay()}
                </div>
                {submission.output && (
                  <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded font-mono text-sm text-white/80 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {submission.output}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
