import { hasCompletedAvatarOnboarding } from '@/lib/avatar-catalog';

type RoutableUser = {
  onboardingCompletedAt?: string | null;
  avatarPresetId?: string | null;
  avatarModelUrl?: string | null;
  avatarPosterUrl?: string | null;
};

export function getPostLoginRoute(user?: RoutableUser | null) {
  if (!user || !hasCompletedAvatarOnboarding(user)) {
    return '/onboarding/avatar';
  }

  return '/dashboard';
}
