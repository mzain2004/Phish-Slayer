import { describe, it, expect } from 'vitest';
import { normalizeIOC } from '../intel/ioc-processor';

describe('normalizeIOC', () => {
  it('should normalize IPs', () => {
    expect(normalizeIOC('ip', '192.168.001.001')).toBe('192.168.1.1');
  });

  it('should normalize SHA256 hashes to lowercase', () => {
    const hash = 'A'.repeat(64);
    expect(normalizeIOC('hash_sha256', hash)).toBe(hash.toLowerCase());
  });

  it('should normalize domains', () => {
    expect(normalizeIOC('domain', 'EVIL.COM.')).toBe('evil.com');
  });
});
