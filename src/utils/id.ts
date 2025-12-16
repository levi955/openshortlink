// Utility functions for generating IDs

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  // Use cryptographically secure random bytes instead of Math.random()
  const randomBytes = crypto.getRandomValues(new Uint8Array(5));
  const random = Array.from(randomBytes)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // Use cryptographically secure random bytes instead of Math.random()
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}
