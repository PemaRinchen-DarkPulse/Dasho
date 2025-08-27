import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { AuthAPI, saveAuth } from "@/lib/api";

const emailRegex = /^[^\s@]+@academy\.bt$/i;

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailRegex.test(form.email)) {
      toast({
        title: "Invalid email",
        description: "Use your academy.bt email to sign in.",
        variant: "destructive",
      });
      return;
    }

    if (!form.password) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await AuthAPI.login({ email: form.email, password: form.password });
      saveAuth({ token: res.token, user: res.user });
      toast({ title: "Welcome back", description: `Signed in as ${res.user.name}` });
      // Determine redirect target:
      // 1) If login was triggered from a protected route, go back there (location.state.from)
      // 2) If user clicked the explicit Log in button (we'll pass state.intent = 'login'), go to My Bookings
      // 3) Otherwise, fallback: admin -> /admin-dashboard, user -> /equipment
      const from = location.state?.from;
      const intent = location.state?.intent;
      if (from) {
        navigate(from, { replace: true });
      } else if (intent === 'login') {
        navigate('/my-bookings', { replace: true });
      } else {
        navigate(res.redirect || (res.user.role === 'admin' ? '/admin-dashboard' : '/equipment'), { replace: true });
      }
    } catch (err) {
      toast({ title: 'Login failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(99dvh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Use your <span className="font-medium">academy.bt</span> email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email</Label>
                  <Badge variant="secondary">academy.bt only</Badge>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@academy.bt"
                  value={form.email}
                  onChange={onChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={submitting}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-4 text-center">
              New here?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
