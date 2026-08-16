'use client';

import dynamic from 'next/dynamic';

const ClawCraneGame = dynamic(() => import('@/components/minigames/claw-crane-game'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[100svh] place-items-center px-4 text-center text-sm font-black uppercase tracking-[0.18em] text-rose-600">
      Loading the prize crane…
    </div>
  ),
});

export default ClawCraneGame;
