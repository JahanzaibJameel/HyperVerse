import { isSensitiveKey, redact } from '@/lib/logger';

describe('logger redaction', () => {
  describe('isSensitiveKey', () => {
    it('matches secret-bearing key names case-insensitively', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('apiKey')).toBe(true);
      expect(isSensitiveKey('api_key')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('Authorization')).toBe(true);
    });

    it('does not match ordinary keys', () => {
      expect(isSensitiveKey('username')).toBe(false);
      expect(isSensitiveKey('userId')).toBe(false);
      expect(isSensitiveKey('count')).toBe(false);
    });
  });

  describe('redact', () => {
    it('replaces secret values with a marker', () => {
      const result = redact({ username: 'ada', password: 'hunter2' });

      expect(result).toEqual({ username: 'ada', password: '[redacted]' });
    });

    it('redacts secrets nested inside objects and arrays', () => {
      const result = redact({
        sessions: [{ id: 'a', token: 'secret-token' }],
        nested: { deep: { apiKey: 'k' } },
      }) as any;

      expect(result.sessions[0].id).toBe('a');
      expect(result.sessions[0].token).toBe('[redacted]');
      expect(result.nested.deep.apiKey).toBe('[redacted]');
    });

    it('leaves non-secret values untouched', () => {
      expect(redact({ count: 3, ok: true, ratio: 1.5 })).toEqual({
        count: 3,
        ok: true,
        ratio: 1.5,
      });
    });

    it('truncates long strings', () => {
      const result = redact('x'.repeat(500)) as string;

      expect(result.length).toBeLessThan(500);
      expect(result).toContain('truncated');
    });

    it('breaks on circular references instead of recursing forever', () => {
      const cyclic: Record<string, unknown> = { name: 'root' };
      cyclic.self = cyclic;

      const result = redact(cyclic) as any;

      expect(result.name).toBe('root');
      expect(result.self).toBe('[circular]');
    });

    it('caps recursion depth', () => {
      const deep = { a: { b: { c: { d: { e: { f: 'bottom' } } } } } };

      const result = JSON.stringify(redact(deep));

      expect(result).toContain('[max depth]');
      expect(result).not.toContain('bottom');
    });

    it('reduces errors to safe name and message, dropping the stack', () => {
      const result = redact(new Error('boom')) as any;

      expect(result).toEqual({ name: 'Error', message: 'boom' });
    });

    it('serialises dates', () => {
      const date = new Date('2026-01-02T03:04:05.000Z');

      expect(redact(date)).toBe('2026-01-02T03:04:05.000Z');
    });

    it('passes through null and undefined', () => {
      expect(redact(null)).toBeNull();
      expect(redact(undefined)).toBeUndefined();
    });

    it('never leaks a secret that is a direct value', () => {
      const result = JSON.stringify(redact({ auth: 'top-secret-value' }));

      expect(result).not.toContain('top-secret-value');
    });
  });
});
