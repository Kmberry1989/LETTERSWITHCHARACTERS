'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '../ui/card';

const themes = [
  { id: 'classic', name: 'Classic Blue', primary: 'bg-primary' },
  { id: 'forest', name: 'Forest Green', primary: 'bg-green-600' },
  { id: 'cosmic', name: 'Cosmic Purple', primary: 'bg-purple-600' },
];

export default function ThemeSelector() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold font-headline">Game Themes</h2>
      <p className="mb-6 text-muted-foreground">
        Choose a theme for the game board and tiles. More themes can be unlocked by completing achievements!
      </p>
      <RadioGroup defaultValue="classic" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <Label
              htmlFor={theme.id}
              className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-4 w-full">
                <RadioGroupItem value={theme.id} id={theme.id} />
                <div className="flex items-center gap-2">
                  <div className={ `w-6 h-6 rounded-full ${theme.primary}` } />
                  <span className="font-semibold">{theme.name}</span>
                </div>
              </div>
            </Label>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
