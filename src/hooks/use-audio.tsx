'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type SfxType = 'click' | 'place' | 'swoosh';

type AudioContextType = {
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  sfxVolume: number;
  setSfxVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playSfx: (type: SfxType) => void;
};

const sfxFiles: Record<SfxType, string> = {
    click: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc09d.mp3', // Placeholder click
    place: 'https://cdn.pixabay.com/audio/2022/03/15/audio_2c63821030.mp3', // Placeholder place
    swoosh: 'https://cdn.pixabay.com/audio/2022/03/24/audio_313a35db9a.mp3', // Placeholder swoosh
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [masterVolume, setMasterVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(70);
  const [sfxVolume, setSfxVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playSfx = useCallback((type: SfxType) => {
    if (isMuted) return;
    const audio = new Audio(sfxFiles[type]);
    audio.volume = (masterVolume / 100) * (sfxVolume / 100);
    audio.play().catch(e => console.error("Error playing sound effect:", e));
  }, [isMuted, masterVolume, sfxVolume]);

  const value = {
    masterVolume,
    setMasterVolume,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    isMuted,
    setIsMuted,
    playSfx,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
