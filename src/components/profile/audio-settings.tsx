'use client';

import { useAudio } from '@/hooks/use-audio';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Volume2, VolumeX } from 'lucide-react';

export default function AudioSettings() {
  const {
    masterVolume,
    setMasterVolume,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    isMuted,
    setIsMuted,
  } = useAudio();

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold font-headline">Audio Settings</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="mute-switch" className="flex items-center gap-2 text-lg">
            {isMuted ? <VolumeX /> : <Volume2 />}
            Master Mute
          </Label>
          <Switch id="mute-switch" checked={isMuted} onCheckedChange={setIsMuted} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="master-volume">Master Volume ({masterVolume})</Label>
          <Slider
            id="master-volume"
            value={[masterVolume]}
            onValueChange={(value) => setMasterVolume(value[0])}
            max={100}
            step={1}
            disabled={isMuted}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="music-volume">Music Volume ({musicVolume})</Label>
          <Slider
            id="music-volume"
            value={[musicVolume]}
            onValueChange={(value) => setMusicVolume(value[0])}
            max={100}
            step={1}
            disabled={isMuted}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sfx-volume">Sound Effects Volume ({sfxVolume})</Label>
          <Slider
            id="sfx-volume"
            value={[sfxVolume]}
            onValueChange={(value) => setSfxVolume(value[0])}
            max={100}
            step={1}
            disabled={isMuted}
          />
        </div>
      </div>
    </div>
  );
}
