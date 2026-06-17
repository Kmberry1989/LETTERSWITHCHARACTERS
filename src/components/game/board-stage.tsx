'use client';

import React from 'react';

export default function BoardStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.25rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(255,241,224,0.94))] p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.1)] touch-none sm:p-3 md:rounded-[1.75rem]">
        <div className="mx-auto flex h-full max-h-full max-w-full items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
