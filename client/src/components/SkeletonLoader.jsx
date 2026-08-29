import React from 'react';

export function KpiCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl hud-panel relative overflow-hidden animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-space-800 rounded" />
        <div className="w-8 h-8 rounded-lg bg-space-800" />
      </div>
      <div className="h-8 w-36 bg-space-800 rounded mt-2" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-2.5 w-20 bg-space-800 rounded" />
        <div className="h-2.5 w-16 bg-space-800 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 8 }) {
  return (
    <tr className="animate-pulse border-b border-indigo-500/10">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="py-4 px-4">
          <div className="h-3.5 bg-space-800 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-5 rounded-2xl hud-panel space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-44 bg-space-800 rounded" />
          <div className="h-2.5 w-64 bg-space-800/60 rounded" />
        </div>
        <div className="h-6 w-20 bg-space-800 rounded" />
      </div>
      <div className="h-60 w-full bg-space-950/60 rounded-xl flex items-end justify-around p-4 gap-3">
        <div className="w-12 bg-space-800/40 rounded-t h-[40%]" />
        <div className="w-12 bg-space-800/60 rounded-t h-[75%]" />
        <div className="w-12 bg-space-800/40 rounded-t h-[30%]" />
        <div className="w-12 bg-space-800/80 rounded-t h-[90%]" />
      </div>
    </div>
  );
}
