'use client';

import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Building2, Mail, Shield, User, LogOut, Info } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout, canAccess } = useAuth();
  const isAdmin = canAccess(['ADMIN']);

  return (
    <>
      <Header
        title="Settings"
        subtitle="Account and workspace preferences"
      />

      <div className="space-y-6 p-6">
        <Card padding="lg">
          <CardHeader
            title="Signed-in account"
            subtitle="Information from your current session"
          />
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-lg border border-surface-100 bg-surface-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <dt className="text-2xs font-medium uppercase tracking-wide text-surface-400">Name</dt>
                <dd className="truncate text-sm font-semibold text-surface-900">{user?.name ?? '—'}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-surface-100 bg-surface-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-200 text-surface-700">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <dt className="text-2xs font-medium uppercase tracking-wide text-surface-400">Email</dt>
                <dd className="truncate text-sm font-medium text-surface-800">{user?.email ?? '—'}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-surface-100 bg-surface-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <dt className="text-2xs font-medium uppercase tracking-wide text-surface-400">Role</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{user?.role?.replace(/_/g, ' ') ?? '—'}</Badge>
                </dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-surface-100 bg-surface-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <dt className="text-2xs font-medium uppercase tracking-wide text-surface-400">Branch</dt>
                <dd className="text-sm text-surface-800">
                  {user?.branchName ?? (user?.branchId ? user.branchId : 'All branches')}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-surface-100 pt-6">
            <Button variant="outline" onClick={() => logout()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </Card>

        {isAdmin && (
          <Card padding="lg">
            <CardHeader
              title="Platform"
              subtitle="Administrator options for this environment"
            />
            <div
              className={cn(
                'mt-4 flex gap-3 rounded-lg border border-dashed border-surface-200 bg-surface-50/50 p-4 text-sm text-surface-600',
              )}
            >
              <Info className="h-5 w-5 flex-shrink-0 text-surface-400" aria-hidden />
              <p>
                Feature flags, API keys, and org-wide defaults are configured via environment and
                deployment (see <code className="rounded bg-surface-200 px-1.5 py-0.5 text-xs">.env</code> and
                operations runbooks). Contact your platform team to change production settings.
              </p>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default SettingsPage;
