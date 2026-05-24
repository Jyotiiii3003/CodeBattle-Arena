import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/auth-guard";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Problems from "@/pages/problems";
import Problem from "@/pages/problem";
import BattleLobby from "@/pages/battle-lobby";
import BattleRoom from "@/pages/battle-room";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/problems" component={Problems} />
      <Route path="/problems/:id" component={() => <AuthGuard><Problem /></AuthGuard>} />
      <Route path="/battle" component={() => <AuthGuard><BattleLobby /></AuthGuard>} />
      <Route path="/battle/:id" component={() => <AuthGuard><BattleRoom /></AuthGuard>} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile/:username" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
