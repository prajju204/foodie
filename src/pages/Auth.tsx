import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import foodieLogo from "@/assets/foodie-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          {/* Card */}
          <div className="border border-[#dadce0] rounded-lg p-8 sm:p-10 shadow-sm">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={foodieLogo} alt="Foodie" className="h-12 w-auto" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-normal text-[#202124] text-center mb-2">
              Welcome Back
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-[#5f6368] text-center mb-8">
              Sign in to your Foodie account
            </p>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-[#202124]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@foodie.com"
                  required
                  className="h-12 border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8] rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-[#202124]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8] rounded-md"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-md transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#dadce0]"></div>
              <span className="px-4 text-sm text-[#5f6368]">or</span>
              <div className="flex-1 h-px bg-[#dadce0]"></div>
            </div>

            {/* Book Catering Link */}
            <div className="text-center">
              <p className="text-sm text-[#5f6368] mb-2">Looking to book catering?</p>
              <a 
                href="/book" 
                className="text-sm font-medium text-[#1a73e8] hover:text-[#174ea6] transition-colors"
              >
                Order catering service
              </a>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#5f6368]">
              New to Foodie? Start ordering delicious catering today.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-[400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5f6368]">
          <span>English (United States)</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#202124] transition-colors">Help</a>
            <a href="#" className="hover:text-[#202124] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#202124] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
