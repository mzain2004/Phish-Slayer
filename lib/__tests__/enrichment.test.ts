import { describe, it, expect } from 'vitest';
import { ruleBasedTag } from '../mitre/auto-tagger';

describe('ruleBasedTag', () => {
  it('should tag Brute Force correctly', () => {
    const alert = { rule_name: 'Brute Force Attempt' };
    const tags = ruleBasedTag(alert);
    expect(tags.some(t => t.id === 'T1110')).toBe(true);
  });

  it('should tag PowerShell correctly', () => {
    const alert = { rule_name: 'Suspicious PowerShell Script' };
    const tags = ruleBasedTag(alert);
    // T1059.001 is a subtechnique of T1059
    expect(tags.some(t => t.id === 'T1059')).toBe(true);
  });

  it('should return empty array for unknown rules', () => {
    const alert = { rule_name: 'xyz_unknown_thing' };
    const tags = ruleBasedTag(alert);
    expect(tags).toHaveLength(0);
  });
});
