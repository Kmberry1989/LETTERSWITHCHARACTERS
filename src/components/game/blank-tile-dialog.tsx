'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type BlankTileDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (letter: string) => void;
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function BlankTileDialog({ isOpen, onClose, onSelect }: BlankTileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose a Letter</DialogTitle>
          <DialogDescription>Select a letter for your blank tile.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2">
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant="outline"
              className="aspect-square text-lg"
              onClick={() => onSelect(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
