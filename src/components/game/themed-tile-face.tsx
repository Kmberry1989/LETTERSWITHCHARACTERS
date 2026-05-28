'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTileCosmetic } from '@/lib/tile-cosmetics';

type ThemedTileFaceProps = {
  tileSetId?: string | null;
  letter: string;
  score: number;
  isBlank?: boolean;
  className?: string;
  interactive?: boolean;
};

export function ThemedTileFace({
  tileSetId,
  letter,
  score,
  isBlank,
  className,
  interactive = false,
}: ThemedTileFaceProps) {
  const tileSet = getTileCosmetic(tileSetId);
  const isQuestionMark = letter === ' ' || letter === '';

  return (
    <motion.div
      layout
      initial={{ scale: 0.94, opacity: 0, y: 4 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: interactive ? 1.04 : 1 }}
      whileTap={{ scale: interactive ? 0.97 : 1 }}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit]',
        className
      )}
      style={{
        backgroundImage: `url(${tileSet.assetPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.54),rgba(255,255,255,0.06)_38%,rgba(15,23,42,0.10)_100%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/10" />
      <span className={cn('relative text-xl font-black text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-2xl md:text-3xl', isBlank && 'text-red-700')}>
        {isQuestionMark ? '?' : letter}
      </span>
      <span className="absolute bottom-0.5 right-1 text-[0.6rem] font-bold text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] sm:text-xs">
        {score}
      </span>
    </motion.div>
  );
}
