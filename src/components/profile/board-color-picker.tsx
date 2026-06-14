'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { hexToHsv, hsvToHex, normalizeBoardColor } from '@/lib/board-skins';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type BoardColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function BoardColorPicker({ value, onChange }: BoardColorPickerProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [hexInput, setHexInput] = useState(value);
  const hsv = hexToHsv(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const updateFromArea = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const saturation = clamp((clientX - rect.left) / rect.width, 0, 1);
    const valueLevel = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    onChange(hsvToHex(hsv.h, saturation, valueLevel));
  };

  const handleAreaPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    updateFromArea(event.clientX, event.clientY);
    const node = areaRef.current;
    if (!node) return;
    node.setPointerCapture(event.pointerId);

    const handleMove = (nextEvent: PointerEvent) => updateFromArea(nextEvent.clientX, nextEvent.clientY);
    const handleUp = () => {
      node.removeEventListener('pointermove', handleMove);
      node.removeEventListener('pointerup', handleUp);
    };

    node.addEventListener('pointermove', handleMove);
    node.addEventListener('pointerup', handleUp, { once: true });
  };

  const commitHexInput = () => {
    const normalized = normalizeBoardColor(hexInput);
    if (normalized) {
      onChange(normalized);
      setHexInput(normalized);
      return;
    }
    setHexInput(value);
  };

  return (
    <div className="space-y-3">
      <div
        ref={areaRef}
        className="relative h-32 w-full cursor-crosshair touch-none overflow-hidden rounded-[1.1rem] border border-slate-200 shadow-inner sm:h-48 sm:rounded-[1.5rem]"
        style={{ backgroundColor: `hsl(${Math.round(hsv.h)} 100% 50%)` }}
        onPointerDown={handleAreaPointerDown}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.35)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: value }}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          <span>Hue</span>
          <span>{value}</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsv.h)}
          onChange={(event) => onChange(hsvToHex(Number(event.target.value), hsv.s, hsv.v))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full border border-white/70 bg-[linear-gradient(90deg,#ff0000_0%,#ffff00_17%,#00ff00_33%,#00ffff_50%,#0000ff_67%,#ff00ff_83%,#ff0000_100%)]"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hex</label>
          <Input
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value.toUpperCase())}
            onBlur={commitHexInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitHexInput();
              }
            }}
            className="mt-2 font-mono uppercase"
            placeholder="#8BBF8D"
          />
        </div>
        <div className="self-end rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
          <div className="h-10 w-14 rounded-xl border border-black/10 shadow-inner sm:h-12 sm:w-20" style={{ backgroundColor: value }} />
        </div>
      </div>
    </div>
  );
}
