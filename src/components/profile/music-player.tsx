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

const CROSSFADE_MS = 1800;
const LOOP_GUARD_SECONDS = 0.08;

type AudioChannel = {
  audio: HTMLAudioElement;
  src: string;
  trackId: MusicTrackId;
  token: number;
};

let generatedAudioContext: AudioContext | null = null;

function getGeneratedAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!generatedAudioContext) generatedAudioContext = new AudioContextCtor();
  return generatedAudioContext;
}

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
}

export default function MusicPlayer() {
  const pathname = usePathname();
  const { masterVolume, musicVolume, isMuted } = useAudio();
  const activeChannelRef = useRef<AudioChannel | null>(null);
  const fadeChannelRef = useRef<AudioChannel | null>(null);
  const nextTokenRef = useRef(0);
  const loopTimeoutRef = useRef<number | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
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

  const clearLoopTimer = () => {
    if (loopTimeoutRef.current) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  };

  const stopFade = () => {
    if (fadeFrameRef.current) {
      window.cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  };

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

  const getTargetVolume = () => {
    if (isMuted || masterVolume <= 0 || musicVolume <= 0) {
      return 0;
    }
    return (masterVolume / 100) * (musicVolume / 100);
  };

  const stopAllAudioChannels = () => {
    clearLoopTimer();
    stopFade();
    stopAudio(activeChannelRef.current?.audio || null);
    stopAudio(fadeChannelRef.current?.audio || null);
    activeChannelRef.current = null;
    fadeChannelRef.current = null;
  };

  const startGeneratedMusic = () => {
    if (fallbackRef.current || getTargetVolume() <= 0) return;
    const context = getGeneratedAudioContext();
    if (!context) return;
    if (context.state === 'suspended') {
      void context.resume();
    }

    const gain = context.createGain();
    const config = GENERATED_MUSIC[trackIdRef.current || trackId];
    const volume = getTargetVolume() * 0.035;
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

  const updateFallbackVolume = () => {
    if (!fallbackRef.current) return;
    fallbackRef.current.gain.gain.setTargetAtTime(
      getTargetVolume() * 0.035,
      getGeneratedAudioContext()?.currentTime || 0,
      0.04,
    );
  };

  const promoteChannel = (channel: AudioChannel) => {
    const fading = activeChannelRef.current;
    if (fading && fading !== channel) {
      fadeChannelRef.current = fading;
    }
    activeChannelRef.current = channel;
  };

  const finishFade = (incoming: AudioChannel | null, outgoing: AudioChannel | null) => {
    if (incoming) {
      incoming.audio.volume = getTargetVolume();
      activeChannelRef.current = incoming;
    }
    if (outgoing) {
      stopAudio(outgoing.audio);
      if (fadeChannelRef.current === outgoing) {
        fadeChannelRef.current = null;
      }
      if (activeChannelRef.current === outgoing) {
        activeChannelRef.current = null;
      }
    }
  };

  const crossfadeChannels = (incoming: AudioChannel, outgoing: AudioChannel | null) => {
    stopFade();

    const targetVolume = getTargetVolume();
    if (!outgoing || targetVolume <= 0) {
      incoming.audio.volume = targetVolume;
      finishFade(incoming, outgoing);
      return;
    }

    incoming.audio.volume = 0;
    const start = performance.now();

    const step = (now: number) => {
      if (activeChannelRef.current?.token !== incoming.token && fadeChannelRef.current?.token !== incoming.token) {
        return;
      }

      const progress = Math.min(1, (now - start) / CROSSFADE_MS);
      incoming.audio.volume = targetVolume * progress;
      outgoing.audio.volume = targetVolume * (1 - progress);

      if (progress < 1) {
        fadeFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      finishFade(incoming, outgoing);
      fadeFrameRef.current = null;
    };

    fadeFrameRef.current = window.requestAnimationFrame(step);
  };

  const scheduleLoopCrossfade = (channel: AudioChannel) => {
    clearLoopTimer();

    const arm = () => {
      if (activeChannelRef.current?.token !== channel.token) {
        return;
      }

      const duration = channel.audio.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        loopTimeoutRef.current = window.setTimeout(arm, 250);
        return;
      }

      const fadeLeadSeconds = Math.min(CROSSFADE_MS / 1000, Math.max(0.2, duration / 2));
      const delayMs = Math.max(0, (duration - fadeLeadSeconds - LOOP_GUARD_SECONDS) * 1000);
      loopTimeoutRef.current = window.setTimeout(() => {
        if (activeChannelRef.current?.token === channel.token) {
          void startTrack(channel.trackId, channel.src, true);
        }
      }, delayMs);
    };

    if (channel.audio.readyState >= 1 && Number.isFinite(channel.audio.duration)) {
      arm();
      return;
    }

    channel.audio.addEventListener('loadedmetadata', arm, { once: true });
  };

  const startTrack = async (nextTrackId: MusicTrackId, nextTrackUrl: string, isLoopRestart = false) => {
    trackIdRef.current = nextTrackId;

    if (unavailableTracksRef.current.has(nextTrackId)) {
      stopAllAudioChannels();
      startGeneratedMusic();
      return;
    }

    if (fadeChannelRef.current) {
      stopAudio(fadeChannelRef.current.audio);
      fadeChannelRef.current = null;
    }

    const audio = new Audio(nextTrackUrl);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = 0;

    const channel: AudioChannel = {
      audio,
      src: nextTrackUrl,
      trackId: nextTrackId,
      token: ++nextTokenRef.current,
    };

    audio.addEventListener('error', () => {
      unavailableTracksRef.current.add(nextTrackId);
      stopAudio(audio);
      stopAllAudioChannels();
      startGeneratedMusic();
    }, { once: true });

    try {
      await audio.play();
      hasStartedRef.current = true;
      stopGeneratedMusic();

      const outgoing = isLoopRestart ? activeChannelRef.current : activeChannelRef.current;
      if (isLoopRestart) {
        fadeChannelRef.current = outgoing;
      }
      promoteChannel(channel);
      crossfadeChannels(channel, outgoing);
      scheduleLoopCrossfade(channel);
    } catch {
      stopAudio(audio);
      stopAllAudioChannels();
      startGeneratedMusic();
    }
  };

  useEffect(() => {
    const targetVolume = getTargetVolume();
    updateFallbackVolume();

    if (targetVolume <= 0) {
      clearLoopTimer();
      stopFade();
      activeChannelRef.current?.audio.pause();
      fadeChannelRef.current?.audio.pause();
      stopGeneratedMusic();
      return;
    }

    const activeAudio = activeChannelRef.current?.audio;
    const fadeAudio = fadeChannelRef.current?.audio;
    if (activeAudio) {
      void activeAudio.play().catch(() => {
        startGeneratedMusic();
      });
    }
    if (fadeAudio) {
      void fadeAudio.play().catch(() => {
        startGeneratedMusic();
      });
    }
  }, [isMuted, masterVolume, musicVolume]);

  useEffect(() => {
    const sameTrack = activeChannelRef.current?.src === trackUrl && activeChannelRef.current?.trackId === trackId;
    if (sameTrack) {
      trackIdRef.current = trackId;
      const targetVolume = getTargetVolume();
      if (activeChannelRef.current) {
        activeChannelRef.current.audio.volume = targetVolume;
      }
      updateFallbackVolume();
      return;
    }

    trackIdRef.current = trackId;

    if (getTargetVolume() <= 0) {
      stopAllAudioChannels();
      return;
    }

    void startTrack(trackId, trackUrl, false);
  }, [trackId, trackUrl, isMuted, masterVolume, musicVolume]);

  useEffect(() => {
    const attemptStart = () => {
      if (
        hasStartedRef.current ||
        getTargetVolume() <= 0
      ) {
        return;
      }

      if (unavailableTracksRef.current.has(trackId)) {
        startGeneratedMusic();
        return;
      }

      void startTrack(trackId, trackUrl, false);
    };

    window.addEventListener('pointerdown', attemptStart, { passive: true, once: true });
    window.addEventListener('keydown', attemptStart, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', attemptStart);
      window.removeEventListener('keydown', attemptStart);
    };
  }, [trackId, trackUrl, isMuted, masterVolume, musicVolume]);

  useEffect(() => {
    return () => {
      stopAllAudioChannels();
      stopGeneratedMusic();
    };
  }, []);

  return null;
}
