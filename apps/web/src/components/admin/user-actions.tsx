'use client';

import { api } from '@/lib/api';
import { useState } from 'react';
import { useLocale } from 'next-intl';

interface UserActionsProps {
  userId: string;
  currentRole: 'USER' | 'ADMIN';
  currentName: string | null;
  emailVerified: boolean;
}

export function UserActions({ userId, currentRole, currentName, emailVerified }: UserActionsProps) {
  const locale = useLocale();
  const [role, setRole] = useState(currentRole);
  const [name, setName] = useState(currentName ?? '');
  const [verified, setVerified] = useState(emailVerified);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/admin/users/${userId}`, {
        role,
        name: name || null,
        emailVerified: verified,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      window.location.href = `/${locale}/admin/users`;
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit form */}
      <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6">
        <h3 className="text-sm font-semibold mb-4">Edit User</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-fg-dim)] block mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              placeholder="Display name"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-fg-dim)] block mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
              className="w-full h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Email verified
          </label>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 rounded-md bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-strong)] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Grant subscription */}
      <GrantSubscription userId={userId} />

      {/* Danger zone */}
      <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-6">
        <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-2">Danger Zone</h3>
        <p className="text-xs text-[var(--color-fg-mute)] mb-4">
          Permanently delete this user and all their data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="h-9 rounded-md border border-[var(--color-danger)]/50 px-5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            Delete user
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 rounded-md bg-[var(--color-danger)] px-5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete permanently'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="h-9 rounded-md border border-[var(--color-bg-grid)] px-5 text-sm text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GrantSubscription({ userId }: { userId: string }) {
  const [plan, setPlan] = useState('PRO');
  const [interval, setInterval] = useState('MONTH');
  const [granting, setGranting] = useState(false);
  const [granted, setGranted] = useState(false);

  const handleGrant = async () => {
    setGranting(true);
    setGranted(false);
    try {
      await api.post('/admin/subscriptions/grant', {
        userId,
        planCode: plan,
        interval,
      });
      setGranted(true);
      setTimeout(() => setGranted(false), 3000);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6">
      <h3 className="text-sm font-semibold mb-4">Grant Subscription</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[var(--color-fg-dim)] block mb-1">
            Plan
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm"
          >
            <option value="HOBBY">Hobby</option>
            <option value="PRO">Pro</option>
            <option value="TEAM">Team</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[var(--color-fg-dim)] block mb-1">
            Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full h-9 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm"
          >
            <option value="MONTH">Monthly</option>
            <option value="YEAR">Yearly</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleGrant}
          disabled={granting}
          className="h-9 rounded-md bg-[var(--color-success)] px-5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {granting ? 'Granting…' : granted ? '✓ Subscription granted' : 'Grant subscription'}
        </button>
      </div>
    </div>
  );
}
