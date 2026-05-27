'use client';

import AvatarSelectionPanel from '@/components/profile/avatar-selection-panel';

export default function AvatarEditor() {
  return (
    <AvatarSelectionPanel
      title="Choose your player avatar"
      description="Your selected character follows you through the lobby, scoreboard, leaderboard, and profile. You can switch presets any time."
      ctaLabel="Save Avatar"
      onCompleteRoute="/profile"
    />
  );
}
