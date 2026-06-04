import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import { awardPlayerProgress } from '@/lib/server/game-rewards';
import {
  applyArcadeSession,
  claimDailyReward,
  normalizeRetentionState,
  type RetentionModeId,
} from '@/lib/retention';

export const dynamic = 'force-dynamic';

type ProgressRequestBody =
  | {
      action: 'arcade-session';
      modeId: RetentionModeId;
      score?: number;
      completed?: boolean;
      completeDailyChallenge?: boolean;
    }
  | {
      action: 'claim-daily-reward';
    };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProgressRequestBody | null;
  if (!body?.action) {
    return NextResponse.json({ error: 'Missing action.' }, { status: 400 });
  }

  const profile = await getDocument<any>('users', user.uid);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }

  const retention = normalizeRetentionState(profile.retention);

  if (body.action === 'claim-daily-reward') {
    const result = claimDailyReward(retention);
    if (!result.claimed) {
      return NextResponse.json({
        claimed: false,
        retention: result.retention,
        rewards: { berries: 0, experience: 0 },
      });
    }

    await updateDocument('users', user.uid, {
      retention: result.retention,
      updatedAt: new Date().toISOString(),
    });
    await awardPlayerProgress(user.uid, {
      berries: result.rewardBerries,
      experience: result.rewardExperience,
    });

    return NextResponse.json({
      claimed: true,
      retention: result.retention,
      rewards: { berries: result.rewardBerries, experience: result.rewardExperience },
    });
  }

  const result = applyArcadeSession(retention, body.modeId, {
    score: body.score,
    completed: body.completed,
    completeDailyChallenge: body.completeDailyChallenge,
  });

  await updateDocument('users', user.uid, {
    retention: result.retention,
    updatedAt: new Date().toISOString(),
  });
  await awardPlayerProgress(user.uid, {
    berries: result.rewardBerries,
    experience: result.rewardExperience,
  });

  return NextResponse.json({
    ok: true,
    retention: result.retention,
    rewards: { berries: result.rewardBerries, experience: result.rewardExperience },
  });
}
