'use client';

import React from 'react';

export default function BoardStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,241,224,0.94))] p-1 shadow-[0_24px_60px_rgba(15,23,42,0.1)] touch-none sm:p-3 md:rounded-[1.75rem] md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,201,71,0.14),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(191,233,255,0.16),transparent_18%),repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0_12px,rgba(255,255,255,0.05)_12px_24px)] opacity-90" />
        <div className="mx-auto flex h-full max-h-full max-w-full items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
