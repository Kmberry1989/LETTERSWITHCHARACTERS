'use client';

import { useAudio } from '@/hooks/use-audio';
import { MUSIC_TRACKS, getMusicTrackForPathname, type MusicTrackId } from '@/lib/audio-assets';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const GENERATED_MUSIC: Record<MusicTrackId, { frequencies: number[]; pulseMs: number }> = {
  menu: { frequencies: [261.63, 329.63, 392], pulseMs: 2200 },
  arcade: { frequencies: [293.66, 369.99, 440], pulseMs: 1500 },
  game: { frequencies: [196, 246.94, 293.66], pulseMs: 2600 },
};

let generatedAudioContext: AudioContext | null = null;

function getGeneratedAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!generatedAudioContext) generatedAudioContext = new AudioContextCtor();
  return generatedAudioContext;
}

export default function MusicPlayer() {
  const pathname = usePathname();
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIdRef = useRef<MusicTrackId | null>(null);
  const hasStartedRef = useRef(false);
  const unavailableTracksRef = useRef<Set<MusicTrackId>>(new Set());
  const fallbackRef = useRef<{
    gain: GainNode;
    oscillators: OscillatorNode[];
    timer: number | null;
  } | null>(null);

  const trackId = getMusicTrackForPathname(pathname);
  const trackUrl = process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL || MUSIC_TRACKS[trackId];

  const stopGeneratedMusic = () => {
    if (fallbackRef.current?.timer) {
      window.clearInterval(fallbackRef.current.timer);
    }
    fallbackRef.current?.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Oscillator may already be stopped during route changes.
      }
    });
    fallbackRef.current = null;
  };

  const startGeneratedMusic = () => {
    if (fallbackRef.current || isMuted || masterVolume <= 0 || musicVolume <= 0) return;
    const context = getGeneratedAudioContext();
    if (!context) return;
    if (context.state === 'suspended') {
      void context.resume();
    }

    const gain = context.createGain();
    const config = GENERATED_MUSIC[trackIdRef.current || trackId];
    const volume = (masterVolume / 100) * (musicVolume / 100) * 0.035;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.connect(context.destination);

    const oscillators = config.frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });

    const timer = window.setInterval(() => {
      const now = context.currentTime;
      config.frequencies.forEach((frequency, index) => {
        const offset = index === 0 ? 0 : 0.06 * index;
        oscillators[index]?.frequency.setTargetAtTime(frequency * (index % 2 === 0 ? 1 : 1.125), now + offset, 0.12);
        oscillators[index]?.frequency.setTargetAtTime(frequency, now + 0.38 + offset, 0.18);
      });
    }, config.pulseMs);

    fallbackRef.current = { gain, oscillators, timer };
    hasStartedRef.current = true;
  };

  useEffect(() => {
    if (trackIdRef.current !== trackId) {
      audioRef.current?.pause();
      audioRef.current = null;
      hasStartedRef.current = false;
      stopGeneratedMusic();
      trackIdRef.current = trackId;
    }

    if (!audioRef.current) {
      const audio = new Audio(trackUrl);
      audio.loop = true;
      audio.preload = 'none';
      audio.addEventListener('error', () => {
        unavailableTracksRef.current.add(trackId);
        audio.pause();
        startGeneratedMusic();
      });
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    
    if (!isMuted && masterVolume > 0 && musicVolume > 0) {
      if (unavailableTracksRef.current.has(trackId)) {
        startGeneratedMusic();
      } else {
        audio.play().then(() => {
          hasStartedRef.current = true;
          stopGeneratedMusic();
        }).catch(() => {
          startGeneratedMusic();
        });
      }
    } else {
        audio.pause();
        stopGeneratedMusic();
    }
    
    audio.volume = (masterVolume / 100) * (musicVolume / 100);
    if (fallbackRef.current) {
      fallbackRef.current.gain.gain.setTargetAtTime(audio.volume * 0.035, getGeneratedAudioContext()?.currentTime || 0, 0.04);
    }

  }, [masterVolume, musicVolume, isMuted, trackId, trackUrl]);

  useEffect(() => {
    const attemptStart = () => {
      if (
        hasStartedRef.current ||
        isMuted ||
        masterVolume <= 0 ||
        musicVolume <= 0
      ) {
        return;
      }

      if (unavailableTracksRef.current.has(trackId)) {
        startGeneratedMusic();
        return;
      }

      audioRef.current?.play().then(() => {
        hasStartedRef.current = true;
        stopGeneratedMusic();
      }).catch(() => {
        startGeneratedMusic();
      });
    };

    window.addEventListener('pointerdown', attemptStart, { passive: true, once: true });
    window.addEventListener('keydown', attemptStart, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', attemptStart);
      window.removeEventListener('keydown', attemptStart);
    };
  }, [isMuted, masterVolume, musicVolume, trackId]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      stopGeneratedMusic();
    };
  }, []);

  return null;
}
