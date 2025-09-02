import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AuthAPI } from '@/lib/api';

export default function Verify() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const e = location.state?.email || sessionStorage.getItem('pendingEmail') || '';
    setEmail(e);
  }, [location.state]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Missing email', description: 'Email is required to verify.', variant: 'destructive' });
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) {
      toast({ title: 'Invalid code', description: 'Enter the 6-digit code from your email.' , variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await AuthAPI.verify({ email, code });
      sessionStorage.removeItem('pendingEmail');
      toast({ title: 'Verified', description: 'Your email has been verified. You can log in now.' });
      navigate('/login', { replace: true, state: { intent: 'login' } });
    } catch (err) {
      toast({ title: 'Verification failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      toast({ title: 'Missing email', description: 'Email is required to resend.', variant: 'destructive' });
      return;
    }
    setResending(true);
    try {
      await AuthAPI.resendCode({ email });
      toast({ title: 'Code resent', description: 'Check your inbox for a new code.' });
    } catch (err) {
      toast({ title: 'Resend failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(99dvh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to {email || 'your email'}. Enter it below to verify.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@academy.bt" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input id="code" value={code} onChange={(e)=>setCode(e.target.value.replace(/[^0-9]/g,''))} placeholder="123456" maxLength={6} />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
            <div className="flex items-center justify-between mt-4">
              <Button type="button" variant="secondary" onClick={()=>navigate('/login')}>
                Back to login
              </Button>
              <Button type="button" variant="outline" onClick={onResend} disabled={resending}>
                {resending ? 'Sending...' : 'Resend code'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
