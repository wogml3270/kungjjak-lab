const DEFAULT_PROFILE_IMAGE = '/default-profile.svg';

export function normalizeProfileImage(value: unknown) {
  if (typeof value !== 'string') return DEFAULT_PROFILE_IMAGE;
  if (value.startsWith('https://')) return value;
  if (value.startsWith('http://'))
    return `https://${value.slice('http://'.length)}`;
  return DEFAULT_PROFILE_IMAGE;
}
