const USERNAME_EMAIL_DOMAIN = 'letterswithcharacters.example.com';

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
