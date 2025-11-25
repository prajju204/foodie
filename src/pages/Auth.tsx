import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { ChefHat } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to sign in");
      }
    } finally {
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
            {/* Icon container */}
            <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
              <ChefHat className="h-14 w-14 text-primary-foreground" strokeWidth={1.5} />
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
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@foodie.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base bg-background/50 border-border/60 focus:border-primary transition-colors"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    onClick={() => toast.info("Password reset functionality coming soon")}
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base bg-background/50 border-border/60 focus:border-primary transition-colors"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>

            {/* Footer note */}
            <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border/50">
              Secure admin access only
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
