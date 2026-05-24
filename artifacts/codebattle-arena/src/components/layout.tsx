import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Swords, Trophy, Code2, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary" />
            <span className="font-orbitron font-bold text-xl tracking-wider text-shadow-neon-cyan">
              CODEBATTLE
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/problems" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/problems') ? 'text-primary' : 'text-muted-foreground'}`}>
              ARENA
            </Link>
            <Link href="/battle" className={`text-sm font-medium transition-colors hover:text-secondary ${location.startsWith('/battle') ? 'text-secondary' : 'text-muted-foreground'}`}>
              BATTLE
            </Link>
            <Link href="/leaderboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/leaderboard') ? 'text-primary' : 'text-muted-foreground'}`}>
              LEADERBOARD
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-muted/50 border border-white/10">
                    <span className="font-orbitron text-xs font-bold text-primary">
                      {user?.username?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel border-white/10">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium font-rajdhani text-lg">{user?.username}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        Rating: <span className="text-primary font-orbitron">{user?.rating}</span>
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => setLocation(`/profile/${user?.username}`)} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    logout();
                    setLocation("/");
                  }} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 box-shadow-neon-cyan transition-all" asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
      
      <footer className="py-6 border-t border-white/10 bg-background">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Code2 className="w-4 h-4" />
            <span className="text-sm font-rajdhani font-semibold tracking-widest">CODEBATTLE ARENA</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Designed for elite competitors.
          </p>
        </div>
      </footer>
    </div>
  );
}
