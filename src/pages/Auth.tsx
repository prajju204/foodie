import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import foodieLogo from "@/assets/foodie-logo.png";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/5 blur-2xl" />
      </div>

      <div className="w-full max-w-[440px] space-y-8">
        {/* Logo and branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
            {/* Logo container */}
            <div className="relative h-24 w-24 rounded-3xl bg-background flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300 p-2">
              <img src={foodieLogo} alt="Foodie Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Foodie
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              Catering Management System
            </p>
          </div>
        </div>
        
        {/* Login Card */}
        <Card className="border border-border/50 shadow-2xl backdrop-blur-xl bg-card/80 overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
              Admin Login
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign in with your Google account to access the dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-8">
            <Button 
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-background hover:bg-muted border-border/60" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </Button>

            {/* Footer note */}
            <div className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border/50 space-y-2">
              <p>Secure admin access only</p>
              <p>
                Looking to book catering?{" "}
                <a href="/book" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Click here to order
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
