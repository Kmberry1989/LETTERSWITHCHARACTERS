const USERNAME_EMAIL_DOMAIN = 'letterswithcharacters.local';

export function normalizeUsername(rawUsername: string) {
  return rawUsername.trim().toLowerCase();
}

export function usernameToAuthEmail(rawUsername: string) {
  const username = normalizeUsername(rawUsername);
  return `${username}@${USERNAME_EMAIL_DOMAIN}`;
}

export function isGeneratedAuthEmail(email: string | null | undefined) {
  return Boolean(email && email.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`));
}

export function mapSupabaseProviderToAppProvider(provider: string | null | undefined): 'google.com' | 'apple.com' | 'password' | 'guest' {
  switch (provider) {
    case 'google':
      return 'google.com';
    case 'apple':
      return 'apple.com';
    case 'anonymous':
      return 'guest';
    default:
      return 'password';
  }
}
