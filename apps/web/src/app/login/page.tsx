'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-950 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Box className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white">ABC Express</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            AI-Integrated Platform
          </h2>
          <p className="mt-3 max-w-md text-lg text-brand-200">
            Operations and finance intelligence for Indonesia's logistics network.
            Human + AI decision-making at scale.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '100+', label: 'Branches' },
              { value: '34', label: 'Provinces' },
              { value: '24/7', label: 'Operations' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-brand-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-brand-400">
          &copy; {new Date().getFullYear()} ABC Express. Internal platform.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Box className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-surface-900">ABC Express AIP</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900">Sign in</h1>
          <p className="mt-1 text-sm text-surface-500">
            Enter your credentials to access the platform.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@abcexpress.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-lg border border-surface-200 bg-surface-50 p-4">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Seeded users (after pnpm db:seed)
            </p>
            <p className="mt-1 text-xs text-surface-500">
              Default password for all: <span className="font-mono text-surface-700">password123</span>
            </p>
            <div className="mt-2 space-y-1 text-xs text-surface-600 font-mono">
              <p>admin@abcexpress.id</p>
              <p>ops.manager@abcexpress.id</p>
              <p>finance@abcexpress.id</p>
            </div>
            <p className="mt-2 text-[11px] text-surface-400">
              With SEED_DEV_RANDOM=1, emails end in .abcexpress.local and the password is printed at the end of the
              seed script.
            </p>
          </div>

          <div className="mt-8 text-center border-t border-surface-200 pt-6">
            <p className="text-sm text-surface-500 mb-4">Are you a customer?</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/track')}
              type="button"
            >
              Track a Shipment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
