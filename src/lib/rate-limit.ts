const requests = new Map<string, number[]>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = requests.get(identifier) ?? [];

  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    requests.set(identifier, valid);
    return { success: false, remaining: 0 };
  }

  valid.push(now);
  requests.set(identifier, valid);

  return { success: true, remaining: limit - valid.length };
}
