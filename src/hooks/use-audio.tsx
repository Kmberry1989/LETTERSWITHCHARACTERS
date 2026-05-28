'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type SfxType = 'click' | 'place' | 'swoosh' | 'success' | 'error';

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

const AudioContext = createContext<AudioContextType | undefined>(undefined);
let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

function createNoiseBuffer(context: AudioContext, duration: number) {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(sampleRate * duration)), sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    const progress = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - progress);
  }

  return buffer;
}

function playTone(
  context: AudioContext,
  options: {
    type?: OscillatorType;
    frequency: number;
    duration: number;
    startVolume: number;
    endVolume?: number;
    detune?: number;
    attack?: number;
    release?: number;
  }
) {
  const {
    type = 'sine',
    frequency,
    duration,
    startVolume,
    endVolume = 0,
    detune = 0,
    attack = 0.01,
    release = 0.08,
  } = options;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.detune.setValueAtTime(detune, context.currentTime);

  const now = context.currentTime;
  const attackEnd = now + attack;
  const releaseStart = Math.max(now + duration - release, attackEnd);
  const endTime = now + duration;

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, startVolume), attackEnd);
  gainNode.gain.setValueAtTime(Math.max(0.0001, startVolume), releaseStart);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, endVolume), endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(endTime + 0.02);
}

function playSwoosh(context: AudioContext, volume: number) {
  const now = context.currentTime;
  const duration = 0.22;
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, duration);

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(950, now);
  filter.frequency.linearRampToValueAtTime(260, now + duration);
  filter.Q.value = 0.9;

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.03);
  gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);
  source.start(now);
  source.stop(now + duration);
}

function playSuccess(context: AudioContext, volume: number) {
  playTone(context, {
    type: 'triangle',
    frequency: 392,
    duration: 0.12,
    startVolume: volume * 0.3,
    endVolume: volume * 0.05,
    attack: 0.004,
    release: 0.05,
  });

  playTone(context, {
    type: 'triangle',
    frequency: 523.25,
    duration: 0.14,
    startVolume: volume * 0.35,
    endVolume: volume * 0.04,
    attack: 0.004,
    release: 0.05,
    detune: -6,
  });

  playTone(context, {
    type: 'sine',
    frequency: 659.25,
    duration: 0.16,
    startVolume: volume * 0.28,
    endVolume: volume * 0.02,
    attack: 0.004,
    release: 0.06,
    detune: 4,
  });
}

function playError(context: AudioContext, volume: number) {
  playTone(context, {
    type: 'square',
    frequency: 160,
    duration: 0.14,
    startVolume: volume * 0.25,
    endVolume: volume * 0.01,
    attack: 0.002,
    release: 0.08,
  });
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [masterVolume, setMasterVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(30);
  const [sfxVolume, setSfxVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playSfx = useCallback((type: SfxType) => {
    if (isMuted) return;
    const context = getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const volume = Math.max(0.0001, (masterVolume / 100) * (sfxVolume / 100));

    switch (type) {
      case 'click':
        playTone(context, {
          type: 'sine',
          frequency: 880,
          duration: 0.045,
          startVolume: volume * 0.12,
          endVolume: 0.0001,
          attack: 0.002,
          release: 0.025,
        });
        break;
      case 'place':
        playTone(context, {
          type: 'triangle',
          frequency: 294,
          duration: 0.06,
          startVolume: volume * 0.22,
          endVolume: volume * 0.03,
          attack: 0.003,
          release: 0.03,
        });
        playTone(context, {
          type: 'triangle',
          frequency: 392,
          duration: 0.08,
          startVolume: volume * 0.12,
          endVolume: 0.0001,
          attack: 0.003,
          release: 0.04,
          detune: 8,
        });
        break;
      case 'swoosh':
        playSwoosh(context, volume);
        break;
      case 'success':
        playSuccess(context, volume);
        break;
      case 'error':
        playError(context, volume);
        break;
      default:
        break;
    }
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
