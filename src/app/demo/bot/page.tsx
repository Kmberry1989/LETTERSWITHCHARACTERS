import type { Metadata } from 'next';
import { LocalBotDemo } from '@/components/local-bot-demo';

export const metadata: Metadata = {
  title: 'Local Bot Demo | Letters with Characters',
  description: 'Play a self-contained Letters with Characters bot demo without an account or production services.',
  robots: { index: false, follow: false },
};

export default function LocalBotDemoPage() {
  return <LocalBotDemo />;
}
