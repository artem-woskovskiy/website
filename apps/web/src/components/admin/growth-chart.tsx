'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
  data: Array<{ date: string; count: number }>;
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-bg-grid)" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-fg-dim)', fontSize: 10 }}
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-fg-dim)', fontSize: 10 }}
          />
          <Tooltip 
            cursor={{ fill: 'var(--color-bg-grid)', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: 'var(--color-bg-elev)', 
              borderColor: 'var(--color-bg-grid)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="count" 
            fill="var(--color-accent)" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
