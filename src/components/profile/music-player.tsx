'use client';

import { useAudio } from '@/hooks/use-audio';
import { useEffect, useRef } from 'react';

const MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/05/27/audio_18c499e74c.mp3';

export default function MusicPlayer() {
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    
    if (!isMuted && masterVolume > 0 && musicVolume > 0) {
        audio.play().catch(e => console.error("Error playing music:", e));
    } else {
        audio.pause();
    }
    
    audio.volume = (masterVolume / 100) * (musicVolume / 100);

  }, [masterVolume, musicVolume, isMuted]);

  return null;
}
