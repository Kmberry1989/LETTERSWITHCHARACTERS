'use client';

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getBoardSkin, getBoardTintPreset } from '@/lib/board-skins';

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
  boardTintId,
  children,
  className,
}: {
  boardThemeId?: string | null;
  boardTintId?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const skin = getBoardSkin(boardThemeId);
  const tint = getBoardTintPreset(boardTintId, skin.id);

  return (
    <div className={cn('relative rounded-[1.75rem] p-4 sm:p-5', className)}>
      <Layer {...skin.shadow} className="translate-y-3 scale-[1.02] blur-xl opacity-60" />
      <Layer {...skin.cloth} />
      <div className="absolute inset-[2.5%] rounded-[1.6rem]" style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.18), 0 28px 48px ${tint.glow}` }} />
      <Layer {...skin.frame} className="rounded-[1.75rem]" />
      <div
        className="relative rounded-[1.2rem] border border-white/20 p-2 sm:p-3"
        style={{ background: skin.boardSurface, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 24px rgba(15,23,42,0.16)' }}
      >
        <Layer {...skin.surfaceOverlay} className="rounded-[1rem]" />
        <div
          className="pointer-events-none absolute inset-0 rounded-[1rem]"
          style={{
            background: tint.overlay,
            mixBlendMode: skin.surfaceOverlay?.tintable === false ? 'normal' : tint.blendMode,
            opacity: tint.opacity ?? 1,
          }}
        />
        <Layer {...skin.highlight} className="rounded-[1rem]" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
