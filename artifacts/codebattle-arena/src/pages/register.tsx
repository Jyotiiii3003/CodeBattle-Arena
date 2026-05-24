import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          toast({
            title: "Registration Complete",
            description: "Welcome to CodeBattle Arena.",
          });
          setLocation("/");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "Could not create account",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel p-8 rounded-xl border-white/10 relative overflow-hidden box-shadow-neon-purple">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
            
            <div className="flex flex-col items-center justify-center mb-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 box-shadow-neon-purple">
                <Swords className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-orbitron font-bold tracking-wider mb-2">JOIN THE ARENA</h1>
              <p className="text-muted-foreground font-rajdhani text-lg">Create your player profile.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-rajdhani font-semibold text-base tracking-wide text-foreground/80">USERNAME</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="codeninjax" 
                          {...field} 
                          className="bg-black/50 border-white/10 focus-visible:border-secondary focus-visible:ring-secondary h-12 font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-rajdhani font-semibold text-base tracking-wide text-foreground/80">EMAIL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="player@codebattle.dev" 
                          {...field} 
                          className="bg-black/50 border-white/10 focus-visible:border-secondary focus-visible:ring-secondary h-12 font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-rajdhani font-semibold text-base tracking-wide text-foreground/80">PASSWORD</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-black/50 border-white/10 focus-visible:border-secondary focus-visible:ring-secondary h-12 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-orbitron font-bold tracking-widest text-lg box-shadow-neon-purple mt-4 transition-all"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "INITIALIZING..." : "REGISTER"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-rajdhani">
                Already a contender?{" "}
                <Link href="/login" className="text-secondary hover:text-secondary/80 font-bold transition-colors">
                  LOG IN HERE
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
