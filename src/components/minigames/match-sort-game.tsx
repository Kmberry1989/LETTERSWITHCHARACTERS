'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { GameScreen } from '@/components/game-screen';
import { ArcadeSessionStatus } from '@/components/retention/arcade-session-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { createArcadeSessionId } from '@/lib/arcade/session-id';
import { cn } from '@/lib/utils';

type GoodsSku = 'chick' | 'bunny' | 'robot' | 'chips';

type GoodsDefinition = {
  sku: GoodsSku;
  label: string;
  emoji: string;
  sticker: string;
  shell: string;
  text: string;
  shadow: string;
};

type GoodsItem = GoodsDefinition & {
  id: string;
};

const GOODS: Record<GoodsSku, GoodsDefinition> = {
  chick: {
    sku: 'chick',
    label: 'Chick',
    emoji: '🐥',
    sticker: 'PEEP',
    shell: 'from-[#fff4a8] via-[#ffe37e] to-[#ffc85a]',
    text: 'text-[#9b5e16]',
    shadow: 'rgba(255, 194, 93, 0.42)',
  },
  bunny: {
    sku: 'bunny',
    label: 'Bunny',
    emoji: '🐰',
    sticker: 'HOP',
    shell: 'from-[#ffd3ef] via-[#ffb7de] to-[#f591c2]',
    text: 'text-[#9d3b73]',
    shadow: 'rgba(246, 155, 205, 0.38)',
  },
  robot: {
    sku: 'robot',
    label: 'Robot',
    emoji: '🤖',
    sticker: 'BEEP',
    shell: 'from-[#bbf2ff] via-[#8be5fb] to-[#63c7ff]',
    text: 'text-[#1f6893]',
    shadow: 'rgba(96, 202, 255, 0.34)',
  },
  chips: {
    sku: 'chips',
    label: 'Chips',
    emoji: '🍟',
    sticker: 'SNACK',
    shell: 'from-[#ffd0ae] via-[#ffb58f] to-[#ff9367]',
    text: 'text-[#9b4529]',
    shadow: 'rgba(255, 150, 103, 0.34)',
  },
};

const ORDER: GoodsSku[] = ['chick', 'bunny', 'robot', 'chips'];

const START_ITEMS: GoodsItem[] = [
  { id: 'robot-1', ...GOODS.robot },
  { id: 'chips-1', ...GOODS.chips },
  { id: 'bunny-1', ...GOODS.bunny },
  { id: 'chick-1', ...GOODS.chick },
  { id: 'chips-2', ...GOODS.chips },
  { id: 'robot-2', ...GOODS.robot },
  { id: 'chick-2', ...GOODS.chick },
  { id: 'bunny-2', ...GOODS.bunny },
  { id: 'chips-3', ...GOODS.chips },
  { id: 'chick-3', ...GOODS.chick },
  { id: 'robot-3', ...GOODS.robot },
  { id: 'bunny-3', ...GOODS.bunny },
];

function createShelves() {
  return ORDER.reduce<Record<GoodsSku, GoodsItem[]>>((shelves, sku) => {
    shelves[sku] = [];
    return shelves;
  }, {} as Record<GoodsSku, GoodsItem[]>);
}

function GoodsFigure({
  item,
  compact = false,
}: {
  item: Pick<GoodsItem, 'emoji' | 'label' | 'sticker' | 'shell' | 'text' | 'shadow'>;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[1rem] border border-white/80 bg-gradient-to-b shadow-[inset_0_2px_0_rgba(255,255,255,0.65),0_10px_18px_rgba(31,41,55,0.12)]',
        item.shell,
        compact ? 'px-1.5 py-1' : 'px-2 py-1.5'
      )}
      style={{ boxShadow: `inset 0 2px 0 rgba(255,255,255,0.72), 0 10px 18px ${item.shadow}` }}
      title={item.label}
      aria-label={item.label}
    >
      <div className="pointer-events-none absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/35 blur-md" />
      <span className={cn('relative z-10 leading-none drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]', compact ? 'text-[1.45rem]' : 'text-[1.85rem] md:text-[2rem]')}>
        {item.emoji}
      </span>
      <span
        className={cn(
          'relative z-10 mt-1 rounded-full border border-white/75 bg-white/72 px-1.5 py-0.5 text-[0.52rem] font-black uppercase tracking-[0.18em] shadow-sm',
          item.text
        )}
      >
        {item.sticker}
      </span>
    </div>
  );
}

function ShelfSlot({
  item,
  highlighted,
}: {
  item?: GoodsItem;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex aspect-[0.92] items-center justify-center rounded-[1rem] border-2 p-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.55)]',
        highlighted ? 'border-[#8ad5ff] bg-[#fff9e7]' : 'border-[#d6b17f] bg-[#f8dfb4]'
      )}
    >
      {item ? (
        <GoodsFigure item={item} compact />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[0.8rem] border border-dashed border-[#d2aa77] bg-[linear-gradient(180deg,rgba(255,246,224,0.78),rgba(248,219,166,0.82))] text-[0.55rem] font-black uppercase tracking-[0.2em] text-[#b67f44]">
          Slot
        </div>
      )}
    </div>
  );
}

export default function MatchSortGame() {
  const { playSfx } = useAudio();
  const [tray, setTray] = useState<GoodsItem[]>(START_ITEMS);
  const [shelves, setShelves] = useState<Record<GoodsSku, GoodsItem[]>>(() => createShelves());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [message, setMessage] = useState('Match each toy to its exact shelf. Categories do not count.');
  const [sessionId, setSessionId] = useState(() => createArcadeSessionId());

  const sortedCount = useMemo(() => ORDER.reduce((sum, sku) => sum + shelves[sku].length, 0), [shelves]);
  const solved = tray.length === 0 && ORDER.every((sku) => shelves[sku].length === 3);
  const selectedItem = tray.find((item) => item.id === selectedItemId) || null;

  const reset = () => {
    playSfx('swoosh');
    setTray(START_ITEMS);
    setShelves(createShelves());
    setSelectedItemId(null);
    setMessage('Match each toy to its exact shelf. Categories do not count.');
    setSessionId(createArcadeSessionId());
  };

  const placeOnShelf = (sku: GoodsSku) => {
    if (!selectedItem) {
      playSfx('arcadeError');
      setMessage('Pick one toy from the cart first.');
      return;
    }

    if (selectedItem.sku !== sku) {
      playSfx('arcadeError');
      setMessage(`Exact match only. ${selectedItem.label} does not go on the ${GOODS[sku].label} shelf.`);
      return;
    }

    playSfx('place');
    setTray((current) => current.filter((item) => item.id !== selectedItem.id));
    setShelves((current) => ({
      ...current,
      [sku]: [...current[sku], selectedItem],
    }));
    setSelectedItemId(null);
    setMessage(`${selectedItem.label} stocked.`);
  };

  return (
    <GameScreen>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[1.7rem] border border-[#f8ddb3] bg-[linear-gradient(180deg,#fff3dc_0%,#ffdba7_100%)] p-2 shadow-[0_30px_80px_rgba(180,114,36,0.18)] md:gap-4 md:p-5">
        <div className="ml-11 flex min-h-10 items-center justify-end gap-2 md:ml-0 md:justify-between">
          <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[#9a6122]">
            {sortedCount}/{START_ITEMS.length}
          </Badge>
          <Button variant="outline" size="icon" className="rounded-full border-white/70 bg-white/75 md:w-auto md:px-4" onClick={reset} aria-label="Restock">
            <RefreshCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Restock</span>
          </Button>
          {solved ? <ArcadeSessionStatus sessionId={sessionId} modeId="match-sort" score={320} /> : null}
        </div>

        <div className="rounded-[1.6rem] border border-[#e2b77f] bg-[linear-gradient(180deg,#ffd89b_0%,#f0b96d_100%)] p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_28px_rgba(120,67,13,0.16)]">
          <div className="rounded-[1.2rem] border border-[#f6d6a2] bg-[linear-gradient(180deg,rgba(255,248,229,0.88),rgba(255,233,191,0.92))] px-4 py-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.8)]">
            <div className="text-[0.7rem] font-black uppercase tracking-[0.26em] text-[#b06a27]">Toy Shelf</div>
            <div className="mt-1 text-lg font-black text-[#7d4517] md:text-2xl">Exact Match Goods Sort</div>
            <div className="mt-1 text-sm text-[#9b6330]">Stock three copies of each identical toy onto its own shelf.</div>
          </div>

          <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3 md:grid-cols-4">
            {ORDER.map((sku) => {
              const definition = GOODS[sku];
              const canReceive = selectedItem?.sku === sku;
              return (
                <button
                  key={sku}
                  type="button"
                  onClick={() => placeOnShelf(sku)}
                  className={cn(
                    'relative flex min-h-[13rem] flex-col rounded-[1.4rem] border-2 border-[#dba15d] bg-[linear-gradient(180deg,#f4b66f_0%,#d98d41_100%)] p-2 text-left shadow-[inset_0_2px_0_rgba(255,255,255,0.36),0_14px_30px_rgba(116,66,19,0.14)] transition-all',
                    canReceive && 'scale-[1.01] border-[#77ceff] ring-4 ring-[#dff6ff]'
                  )}
                >
                  <div className="rounded-[1rem] border border-[#f5cf9d] bg-[linear-gradient(180deg,#fff6de_0%,#ffe6b9_100%)] p-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.75)]">
                    <div className="flex items-center gap-2">
                      <div className="h-14 w-14 shrink-0 rounded-[1rem] border border-white/80 bg-white/55 p-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.75)]">
                        <GoodsFigure item={definition} compact />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-[#ba7736]">Exact Shelf</div>
                        <div className="text-sm font-black text-[#7d4517] md:text-base">{definition.label}</div>
                        <div className={cn('mt-1 inline-flex rounded-full bg-white/75 px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.16em]', definition.text)}>
                          {definition.sticker}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid flex-1 grid-cols-3 gap-1.5 rounded-[1rem] border border-[#c7843c] bg-[linear-gradient(180deg,#f3bf7a_0%,#e9a95d_100%)] p-2 shadow-inner">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <ShelfSlot key={index} item={shelves[sku][index]} highlighted={canReceive} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 rounded-[1.6rem] border border-[#e0b27f] bg-[linear-gradient(180deg,#ffdca7_0%,#ffc681_100%)] p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_16px_34px_rgba(152,90,25,0.12)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#b56e2c]">Stock Cart</div>
              <div className="text-sm font-bold text-[#8a4f1d]">Pick a toy, then tap its exact matching shelf.</div>
            </div>
            {message ? <div className="max-w-[16rem] text-right text-xs font-bold text-[#8f5924] md:text-sm">{message}</div> : null}
          </div>

          <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
            {tray.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playSfx('arcadeSelect');
                  setSelectedItemId((current) => (current === item.id ? null : item.id));
                  setMessage(`Selected ${item.label}. Find the identical shelf.`);
                }}
                className={cn(
                  'rounded-[1.25rem] border-2 bg-[linear-gradient(180deg,#fff6e5_0%,#ffe2b2_100%)] p-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_10px_22px_rgba(145,84,23,0.12)] transition-all',
                  selectedItemId === item.id ? 'border-[#ff9d4a] ring-4 ring-[#ffe2b2]' : 'border-[#f0c68e]'
                )}
              >
                <div className="aspect-[0.92]">
                  <GoodsFigure item={item} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameScreen>
  );
}
