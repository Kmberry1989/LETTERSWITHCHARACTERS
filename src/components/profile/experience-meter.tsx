'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getExperienceProgress } from '@/lib/tile-cosmetics';

type ExperienceMeterProps = {
  experience: number;
  level?: number;
  className?: string;
  compact?: boolean;
};

function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(value);
  const targetRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (targetRef.current === target) {
      return;
    }

    const from = valueRef.current;
    const to = target;
    const start = performance.now();
    let frameId = 0;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        targetRef.current = target;
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [duration, target]);

  return value;
}

export default function ExperienceMeter({
  experience,
  level,
  className,
  compact = false,
}: ExperienceMeterProps) {
  const progress = useMemo(() => getExperienceProgress(experience), [experience]);
  const animatedExperience = useAnimatedNumber(experience);
  const [xpGain, setXpGain] = useState<number | null>(null);
  const [levelGain, setLevelGain] = useState<number | null>(null);
  const previousExperienceRef = useRef(experience);
  const previousLevelRef = useRef(level ?? progress.level);
  const hasMountedRef = useRef(false);
  const xpGainTimeoutRef = useRef<number | null>(null);
  const levelGainTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const resolvedLevel = level ?? progress.level;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousExperienceRef.current = experience;
      previousLevelRef.current = resolvedLevel;
      return;
    }

    if (experience > previousExperienceRef.current) {
      setXpGain(experience - previousExperienceRef.current);
      if (xpGainTimeoutRef.current) {
        window.clearTimeout(xpGainTimeoutRef.current);
      }
      xpGainTimeoutRef.current = window.setTimeout(() => setXpGain(null), 1200);
    }

    if (resolvedLevel > previousLevelRef.current) {
      setLevelGain(resolvedLevel - previousLevelRef.current);
      if (levelGainTimeoutRef.current) {
        window.clearTimeout(levelGainTimeoutRef.current);
      }
      levelGainTimeoutRef.current = window.setTimeout(() => setLevelGain(null), 1500);
    }

    previousExperienceRef.current = experience;
    previousLevelRef.current = resolvedLevel;
  }, [experience, level, progress.level]);

  useEffect(() => {
    return () => {
      if (xpGainTimeoutRef.current) {
        window.clearTimeout(xpGainTimeoutRef.current);
      }
      if (levelGainTimeoutRef.current) {
        window.clearTimeout(levelGainTimeoutRef.current);
      }
    };
  }, []);

  const resolvedLevel = level ?? progress.level;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full border border-white/70 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className
      )}
    >
      <div className={cn('flex items-center justify-between gap-4', compact ? 'mb-2' : 'mb-3')}>
        <motion.div
          key={resolvedLevel}
          initial={{ scale: 0.92, y: 4, opacity: 0.85 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 font-black text-white shadow-lg',
            compact ? 'py-1 text-[0.7rem] uppercase tracking-[0.16em]' : 'py-1.5 text-xs uppercase tracking-[0.2em]'
          )}
        >
          <span>Level</span>
          <span>{resolvedLevel}</span>
        </motion.div>

        <div className={cn('font-semibold tabular-nums text-slate-700', compact ? 'text-[0.75rem]' : 'text-sm')}>
          XP {animatedExperience.toLocaleString()}
        </div>
      </div>

      <div className={cn('relative overflow-hidden rounded-full bg-slate-200/80', compact ? 'h-3' : 'h-4')}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 shadow-[0_0_18px_rgba(249,115,22,0.4)]"
          initial={false}
          animate={{ width: `${Math.max(3, progress.progress * 100)}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        />
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(255,255,255,0.02))]" />
      </div>

      <div className={cn('mt-2 flex items-center justify-between', compact ? 'text-[0.65rem]' : 'text-xs')}>
        <span className="font-medium text-slate-600">
          {progress.experienceIntoLevel.toLocaleString()} / {progress.experienceNeeded.toLocaleString()} to next level
        </span>
        <div className="relative min-h-4">
          <AnimatePresence mode="wait">
            {xpGain !== null ? (
              <motion.span
                key={`xp-${xpGain}`}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                className="absolute right-0 rounded-full bg-amber-100 px-2 py-0.5 font-black text-amber-900 shadow-sm"
              >
                +{xpGain} XP
              </motion.span>
            ) : levelGain !== null ? (
              <motion.span
                key={`level-${levelGain}`}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                className="absolute right-0 rounded-full bg-slate-950 px-2 py-0.5 font-black text-white shadow-lg"
              >
                +{levelGain} Level{levelGain > 1 ? 's' : ''}
              </motion.span>
            ) : (
              <motion.span
                key="steady"
                initial={{ opacity: 0.45 }}
                animate={{ opacity: 1 }}
                className="font-semibold text-slate-500"
              >
                Progressing steadily
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
