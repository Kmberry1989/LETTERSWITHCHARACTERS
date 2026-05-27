'use client';

import { useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { AlertTriangle, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvatarViewerProps = {
  name: string;
  modelUrl?: string | null;
  posterUrl?: string | null;
  accentClassName?: string;
  onModelError?: (hasError: boolean) => void;
  className?: string;
};

export default function AvatarViewer({
  name,
  modelUrl,
  posterUrl,
  accentClassName,
  onModelError,
  className,
}: AvatarViewerProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  const handleError = () => {
    setLoadFailed(true);
    onModelError?.(true);
  };

  const handleLoad = () => {
    setLoadFailed(false);
    onModelError?.(false);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800',
        className
      )}
    >
      <Script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js" />
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', accentClassName)} />
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_60%)]" />
      {!loadFailed && modelUrl ? (
        <model-viewer
          src={modelUrl}
          poster={posterUrl || undefined}
          alt={name}
          camera-controls
          disable-zoom
          autoplay
          shadow-intensity="1"
          shadow-softness="0.8"
          environment-image="neutral"
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', minHeight: 360, background: 'transparent' }}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <div className="relative flex min-h-[360px] items-center justify-center p-8">
          {posterUrl ? (
            <div className="relative h-64 w-64 overflow-hidden rounded-3xl border border-white/15 bg-black/20 shadow-2xl">
              <Image src={posterUrl} alt={name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/20 text-white/80">
              No avatar preview available
            </div>
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">Avatar Preview</div>
          <div className="text-lg font-semibold">{name}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80">
          {loadFailed ? <AlertTriangle className="h-3.5 w-3.5" /> : <Orbit className="h-3.5 w-3.5" />}
          {loadFailed ? 'Poster fallback' : 'Drag to rotate'}
        </div>
      </div>
    </div>
  );
}
