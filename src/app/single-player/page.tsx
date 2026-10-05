import type { Metadata } from 'next';
import { LocalBotDemo } from '@/components/local-bot-demo';

export const metadata: Metadata = {
  title: 'Single Player | Letters with Characters',
  description: 'Play a private single-player Letters with Characters match against Bitty Botty.',
};

export default function SinglePlayerPage() {
  return <LocalBotDemo />;
}
