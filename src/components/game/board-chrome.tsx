'use client';

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { resolveBoardAppearance } from '@/lib/board-skins';

function Layer({
  assetPath,
  background,
  opacity = 1,
  blendMode,
  className,
}: {
  assetPath?: string;
  background?: string;
  opacity?: number;
  blendMode?: CSSProperties['mixBlendMode'];
  className?: string;
}) {
  if (!assetPath && !background) return null;

  return (
    <div className={cn('absolute inset-0 overflow-hidden rounded-[inherit]', className)} style={{ opacity, mixBlendMode: blendMode }}>
      {background ? <div className="absolute inset-0" style={{ background }} /> : null}
      {assetPath ? <Image src={assetPath} alt="" fill className="object-cover" /> : null}
    </div>
  );
}

export default function BoardChrome({
  boardThemeId,
  boardColor,
  boardTintId,
  children,
  className,
}: {
  boardThemeId?: string | null;
  boardColor?: string | null;
  boardTintId?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const appearance = resolveBoardAppearance(boardThemeId, boardColor, boardTintId);
  const skin = appearance.skin;

  return (
    <div className={cn('relative rounded-[0.82rem] p-1 sm:rounded-[1.1rem] sm:p-2.5 md:p-3.5', className)} style={appearance.boardVars}>
      <Layer {...skin.shadow} className="translate-y-3 scale-[1.02] blur-xl opacity-60" />
      <Layer {...skin.cloth} />
      <div
        className="pointer-events-none absolute inset-0 rounded-[0.82rem] sm:rounded-[1.1rem]"
        style={{ background: 'var(--board-cloth-tint)', mixBlendMode: 'soft-light' }}
      />
      <div className="absolute inset-[1.15%] rounded-[0.74rem] sm:rounded-[1rem]" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.18), 0 28px 48px var(--board-frame-glow)' }} />
      <Layer {...skin.frame} className="rounded-[0.82rem] sm:rounded-[1.1rem]" />
      <div
        className="pointer-events-none absolute inset-0 rounded-[0.82rem] sm:rounded-[1.1rem]"
        style={{ background: 'var(--board-frame-tint)', mixBlendMode: 'overlay', opacity: 0.92 }}
      />
      <div
        className="relative rounded-[0.56rem] border border-white/20 p-[0.22rem] sm:rounded-[0.85rem] sm:p-1.5"
        style={{ background: skin.boardSurface, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 24px rgba(15,23,42,0.16)' }}
      >
        <Layer {...skin.surfaceOverlay} className="rounded-[0.46rem] sm:rounded-[0.7rem]" />
        <div
          className="pointer-events-none absolute inset-0 rounded-[0.46rem] sm:rounded-[0.7rem]"
          style={{
            background: 'var(--board-surface-tint)',
            mixBlendMode: skin.surfaceOverlay?.tintable === false ? 'normal' : 'overlay',
            opacity: 1,
          }}
        />
        <Layer {...skin.highlight} className="rounded-[0.46rem] sm:rounded-[0.7rem]" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
