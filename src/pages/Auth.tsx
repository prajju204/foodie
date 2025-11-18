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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <ChefHat className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Foodie
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Catering Management System
          </p>
        </div>
        
        <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Admin Access</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage your catering business
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@foodie.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
