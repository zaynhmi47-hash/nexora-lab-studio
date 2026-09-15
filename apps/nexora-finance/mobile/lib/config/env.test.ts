import { describe, expect, it } from 'vitest';

describe('mobile environment configuration', () => {
  it('keeps the API URL normalized', async () => {
    const { env } = await import('./env');
    expect(env.nexoraApiUrl).not.toMatch(/\/$/);
  });
});
