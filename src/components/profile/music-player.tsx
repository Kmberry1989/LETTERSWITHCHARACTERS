'use client';

import { useAudio } from '@/hooks/use-audio';
import { useEffect, useRef } from 'react';

const MUSIC_URL = process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL;

export default function MusicPlayer() {
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const isUnavailableRef = useRef(false);

  useEffect(() => {
    if (!MUSIC_URL) {
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio(MUSIC_URL);
      audio.loop = true;
      audio.preload = 'none';
      audio.addEventListener('error', () => {
        isUnavailableRef.current = true;
        audio.pause();
      });
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (!audio || isUnavailableRef.current) {
      return;
    }
    
    if (!isMuted && masterVolume > 0 && musicVolume > 0) {
        audio.play().then(() => {
          hasStartedRef.current = true;
        }).catch(() => {
          // Ignore autoplay failures until the next user gesture.
        });
    } else {
        audio.pause();
    }
    
    audio.volume = (masterVolume / 100) * (musicVolume / 100);

  }, [masterVolume, musicVolume, isMuted]);

  useEffect(() => {
    const attemptStart = () => {
      if (
        !MUSIC_URL ||
        hasStartedRef.current ||
        !audioRef.current ||
        isUnavailableRef.current ||
        isMuted ||
        masterVolume <= 0 ||
        musicVolume <= 0
      ) {
        return;
      }

      audioRef.current.play().then(() => {
        hasStartedRef.current = true;
      }).catch(() => {
        // Ignore autoplay failures until the next user gesture.
      });
    };

    window.addEventListener('pointerdown', attemptStart, { passive: true, once: true });
    window.addEventListener('keydown', attemptStart, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', attemptStart);
      window.removeEventListener('keydown', attemptStart);
    };
  }, [isMuted, masterVolume, musicVolume]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return null;
}
