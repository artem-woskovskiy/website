'use client';

import { useTranslations } from 'next-intl';
import {
  GitBranch,
  KeyRound,
  Layers,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { RevealItem, RevealStagger } from './reveal';
import { Tilt } from './tilt';

const ICONS = [Terminal, Workflow, GitBranch, Layers, KeyRound, Palette, Zap, ShieldCheck, MonitorSmartphone] as const;

export function FeatureGrid() {
  const t = useTranslations('features');

  return (
    <RevealStagger className="grid grid-cols-1 gap-4 md:grid-cols-3" stagger={0.06}>
      {ICONS.map((Icon, i) => {
        const idx = i + 1;
        return (
          <RevealItem key={idx}>
            <Tilt className="group h-full" intensity={4}>
              <div className="h-full rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[0_24px_60px_-30px_oklch(0.6_0.18_260/0.4)]">
                <Icon className="size-5 text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110" />
                <h3 className="mt-4 text-base font-medium">{t(`f${idx}Title` as 'f1Title')}</h3>
                <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{t(`f${idx}Body` as 'f1Body')}</p>
              </div>
            </Tilt>
          </RevealItem>
        );
      })}
    </RevealStagger>
  );
}
