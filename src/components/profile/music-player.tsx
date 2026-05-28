'use client';

import { useAudio } from '@/hooks/use-audio';
import { useEffect, useRef } from 'react';

const MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/05/27/audio_18c499e74c.mp3';

export default function MusicPlayer() {
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    
    if (!isMuted && masterVolume > 0 && musicVolume > 0) {
        audio.play().then(() => {
          hasStartedRef.current = true;
        }).catch(e => console.error("Error playing music:", e));
    } else {
        audio.pause();
    }
    
    audio.volume = (masterVolume / 100) * (musicVolume / 100);

  }, [masterVolume, musicVolume, isMuted]);

  useEffect(() => {
    const attemptStart = () => {
      if (hasStartedRef.current || !audioRef.current || isMuted || masterVolume <= 0 || musicVolume <= 0) {
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
