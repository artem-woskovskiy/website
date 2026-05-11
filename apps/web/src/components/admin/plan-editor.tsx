'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Edit3, Check, X, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthlyRub: number;
  priceYearlyRub: number;
  features: string[];
  panesLimit: number;
  workspacesLimit: number;
  isActive: boolean;
}

export function PlanEditor({ plan }: { plan: Plan }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(plan);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(`/admin/plans/${plan.id}`, form);
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      alert('Error updating plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-[var(--color-bg-grid)] text-sm font-medium hover:bg-[var(--color-bg-grid)] transition-colors"
      >
        <Edit3 className="size-3.5" />
        Edit Plan
      </button>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-accent-soft)]">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Active</label>
          <select
            value={String(form.isActive)}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Description</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full h-16 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-2 text-xs focus:outline-none focus:border-[var(--color-accent)] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Price Monthly (kop)</label>
          <input
            type="number"
            value={form.priceMonthlyRub}
            onChange={(e) => setForm({ ...form, priceMonthlyRub: Number(e.target.value) })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Price Yearly (kop)</label>
          <input
            type="number"
            value={form.priceYearlyRub}
            onChange={(e) => setForm({ ...form, priceYearlyRub: Number(e.target.value) })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Panes (-1 = ∞)</label>
          <input
            type="number"
            value={form.panesLimit}
            onChange={(e) => setForm({ ...form, panesLimit: Number(e.target.value) })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-[var(--color-fg-dim)]">Workspaces (-1 = ∞)</label>
          <input
            type="number"
            value={form.workspacesLimit}
            onChange={(e) => setForm({ ...form, workspacesLimit: Number(e.target.value) })}
            className="w-full h-8 rounded border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 h-8 rounded bg-[var(--color-accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          Save Changes
        </button>
        <button
          onClick={() => setIsEditing(false)}
          disabled={loading}
          className="flex items-center justify-center h-8 px-3 rounded border border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] hover:bg-[var(--color-bg-grid)] transition-colors disabled:opacity-50"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
