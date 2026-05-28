type RoutableUser = {
  onboardingCompletedAt?: string | null;
  avatarPresetId?: string | null;
  avatarModelUrl?: string | null;
  avatarPosterUrl?: string | null;
};

export function getPostLoginRoute(user?: RoutableUser | null) {
  return '/dashboard';
}
