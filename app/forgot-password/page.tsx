'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message);
      return;
    }

    setMessage(data.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 w-full max-w-sm px-4">
        <h2 className="text-xl font-semibold text-center">Forgot password?</h2>
        <p className="text-sm text-muted-foreground text-center">
          Enter your email and we will send you a reset link.
        </p>

        <Input
          type="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-500">{message}</p>}

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <a href="/" className="underline underline-offset-4 hover:text-primary">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}