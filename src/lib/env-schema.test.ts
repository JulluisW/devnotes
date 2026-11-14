import { describe, expect, it } from 'vitest';
import { parseEnv } from './env-schema';

describe('parseEnv', () => {
  it('accepts good values and fills in the default SITE_URL', () => {
    const env = parseEnv({ CMS_WEBHOOK_SECRET: 'a-long-enough-secret' });
    expect(env.SITE_URL).toBe('http://localhost:3005');
  });

  it('rejects a short secret with a message that names the variable', () => {
    expect(() => parseEnv({ CMS_WEBHOOK_SECRET: 'short' })).toThrow(/CMS_WEBHOOK_SECRET: must be at least 16 characters/);
  });

  it('rejects a SITE_URL that is not a URL', () => {
    expect(() => parseEnv({ CMS_WEBHOOK_SECRET: 'a-long-enough-secret', SITE_URL: 'devnotes' })).toThrow(/SITE_URL/);
  });
});
