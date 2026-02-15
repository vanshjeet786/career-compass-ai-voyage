import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogIn, UserPlus, Github, Mail, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    // Redirect authenticated users
    navigate("/background-info");
  }

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) {
          // User already exists
          toast({ 
            title: "Account exists", 
            description: "This account already exists. Please log in instead.",
            variant: "destructive"
          });
        } else {
          toast({ 
            title: "Check your email", 
            description: "Confirm your email to finish signup, then log in." 
          });
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password
        });
        if (error) throw error;
        toast({ title: "Welcome back", description: "You are now signed in." });
        navigate("/background-info");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Invalid credentials. Please check your email and password.";
      console.error("Auth error:", e);
      toast({ 
        title: "Auth error", 
        description: message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const oauthLogin = async (provider: "google" | "github") => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl } });
      if (error) throw error;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ title: "OAuth error", description: message, variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Career Compass</CardTitle>
          <CardDescription>
            {mode === "login" ? "Log in to continue your assessment" : "Create an account to start your journey"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleEmailAuth} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {mode === "login" ? "Log In" : "Sign Up"}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => oauthLogin("google")}> 
              <Mail className="mr-2 h-4 w-4" /> Google
            </Button>
            <Button variant="secondary" onClick={() => oauthLogin("github")}>
              <Github className="mr-2 h-4 w-4" /> GitHub
            </Button>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            {mode === "login" ? (
              <>Don't have an account? <button className="underline" onClick={() => setMode("signup")}>Sign up</button></>
            ) : (
              <>Already have an account? <button className="underline" onClick={() => setMode("login")}>Log in</button></>
            )}
          </div>
          <div className="text-center text-xs text-muted-foreground">
            By continuing you agree to our terms and privacy.
          </div>
          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-sm underline">
              <MessageCircle className="mr-2 h-4 w-4" /> Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Auth;
