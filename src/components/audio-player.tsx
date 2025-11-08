'use client';

import { useAudio } from '@/hooks/use-audio';
import { useEffect, useRef } from 'react';

export default function AudioPlayer() {
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (masterVolume / 100) * (musicVolume / 100);
      audioRef.current.muted = isMuted;
    }
  }, [masterVolume, musicVolume, isMuted]);

  return (
    <audio
      ref={audioRef}
      src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Placeholder music
      loop
      autoPlay
    />
  );
}
