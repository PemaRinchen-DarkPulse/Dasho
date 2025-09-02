import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { AuthAPI } from "@/lib/api";

const emailRegex = /^[^\s@]+@academy\.bt$/i;

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", "confirm-password": "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }

    if (!emailRegex.test(form.email)) {
      toast({ title: "Invalid email", description: "Only academy.bt emails can register.", variant: "destructive" });
      return;
    }

    if (form.password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    if (form.password !== form["confirm-password"]) {
      toast({ title: "Passwords do not match", description: "Please make sure both passwords are identical.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await AuthAPI.register({ name: form.name.trim(), email: form.email, password: form.password });
      sessionStorage.setItem('pendingEmail', form.email);
      toast({ title: "Verify your email", description: "We sent a 6-digit code to your inbox." });
      navigate('/verify', { state: { email: form.email } });
    } catch (err) {
      toast({ title: 'Registration failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-12 min-h-full grid place-items-center">
        <div className="max-w-md mx-auto w-full mt-8 md:mt-16">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Register</CardTitle>
              <CardDescription>
                Only users with an <span className="font-medium">academy.bt</span> email can register.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" placeholder="Jigme Dorji" value={form.name} onChange={onChange} />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={form["confirm-password"]}
                    onChange={onChange}
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {submitting ? "Creating..." : "Create account"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                Already have an account? <Link to={{ pathname: "/login" }} state={{ intent: "login" }} className="text-primary hover:underline">Log in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
