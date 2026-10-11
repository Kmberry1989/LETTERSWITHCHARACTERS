"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useComfortSettings } from "@/hooks/use-comfort-settings";

export default function ComfortSettings() {
  const { settings, patch, reset, ready } = useComfortSettings();

  if (!ready) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comfort Settings</CardTitle>
        <CardDescription>Make the games easier to see and use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="comfort-mode">Text & Display Size</Label>
          <select
            id="comfort-mode"
            value={settings.comfortMode}
            onChange={(e) =>
              patch({ comfortMode: e.target.value as typeof settings.comfortMode })
            }
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
          >
            <option value="standard">Standard</option>
            <option value="large">Larger Text & Buttons</option>
            <option value="highContrast">High Contrast</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Reduce motion</Label>
            <p className="text-sm text-muted-foreground">Calms animations and transitions.</p>
          </div>
          <Switch
            checked={settings.reduceMotion}
            onCheckedChange={(v) => patch({ reduceMotion: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Sound</Label>
            <p className="text-sm text-muted-foreground">Game sounds and effects.</p>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(v) => patch({ soundEnabled: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Vibration</Label>
            <p className="text-sm text-muted-foreground">Gentle buzz on key moments.</p>
          </div>
          <Switch
            checked={settings.hapticsEnabled}
            onCheckedChange={(v) => patch({ hapticsEnabled: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Confirm important moves</Label>
            <p className="text-sm text-muted-foreground">Ask before submitting a word.</p>
          </div>
          <Switch
            checked={settings.confirmMoves}
            onCheckedChange={(v) => patch({ confirmMoves: v })}
          />
        </div>

        <Button variant="outline" onClick={reset} className="w-full">
          Reset to defaults
        </Button>
      </CardContent>
    </Card>
  );
}
