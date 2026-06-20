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
  showScore?: boolean;
  textTone?: 'dark' | 'light';
};

export function ThemedTileFace({
  tileSetId,
  letter,
  score,
  isBlank,
  className,
  interactive = false,
  showScore = true,
  textTone,
}: ThemedTileFaceProps) {
  const tileSet = getTileCosmetic(tileSetId);
  const isQuestionMark = letter === ' ' || letter === '';
  const resolvedTextTone = textTone === 'light' || textTone === 'dark' ? textTone : tileSet.readabilityTone;
  const usesLightText = resolvedTextTone === 'light';
  const primaryTextClass = usesLightText ? 'text-white' : 'text-slate-950';
  const accentTextClass = isBlank ? (usesLightText ? 'text-rose-100' : 'text-rose-700') : primaryTextClass;
  const letterPlateClass = usesLightText
    ? 'bg-[radial-gradient(circle,rgba(3,7,18,0.78),rgba(3,7,18,0.42)_58%,rgba(3,7,18,0)_78%)]'
    : 'bg-[radial-gradient(circle,rgba(255,255,255,0.88),rgba(255,255,255,0.56)_58%,rgba(255,255,255,0)_78%)]';
  const scorePlateClass = usesLightText
    ? 'bg-[linear-gradient(135deg,rgba(3,7,18,0.76),rgba(15,23,42,0.5))]'
    : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.62))]';
  const textOutline = usesLightText
    ? '0 1px 0 rgba(0,0,0,0.92), 0 0 8px rgba(0,0,0,0.55), 1px 0 0 rgba(0,0,0,0.72), -1px 0 0 rgba(0,0,0,0.72), 0 -1px 0 rgba(0,0,0,0.72)'
    : '0 1px 0 rgba(255,255,255,0.96), 0 0 8px rgba(255,255,255,0.52), 1px 0 0 rgba(255,255,255,0.74), -1px 0 0 rgba(255,255,255,0.74), 0 -1px 0 rgba(255,255,255,0.74)';

  return (
    <motion.div
      layout
      initial={{ scale: 0.94, opacity: 0, y: 4 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: interactive ? 1.04 : 1 }}
      whileTap={{ scale: interactive ? 0.97 : 1 }}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.2rem] [container-type:inline-size] sm:rounded-sm',
        className
      )}
      style={{
        backgroundImage: `url(${tileSet.assetPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.54),rgba(255,255,255,0.06)_38%,rgba(15,23,42,0.10)_100%)]"
        animate={{
          opacity: [0.72, 0.92, 0.72],
        }}
        transition={{
          duration: 3.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_45%)] mix-blend-screen"
        animate={interactive ? { x: ['-8%', '8%', '-8%'] } : undefined}
        transition={interactive ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[0.2rem] ring-1 ring-black/10 sm:rounded-sm" />
      <div className={cn('pointer-events-none absolute left-1/2 top-[47%] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px]', letterPlateClass)} />
      <span
        className={cn('relative text-[clamp(0.68rem,52cqw,1.92rem)] font-black leading-none', accentTextClass)}
        style={{ textShadow: textOutline }}
      >
        {isQuestionMark ? '?' : letter}
      </span>
      {showScore ? (
        <div className="absolute bottom-[5%] right-[5%]">
          <div className={cn('absolute inset-0 rounded-full blur-[0.5px]', scorePlateClass)} />
          <span
            className={cn('relative block rounded-full px-[0.18rem] py-[0.05rem] text-[clamp(0.35rem,20cqw,0.8rem)] font-black leading-none', primaryTextClass)}
            style={{ textShadow: textOutline }}
          >
            {score}
          </span>
        </div>
      ) : null}
    </motion.div>
  );
}
