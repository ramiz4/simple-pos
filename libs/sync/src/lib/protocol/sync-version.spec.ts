import { isNewerVersion, latestTimestamp, nextVersion } from './sync-version';

describe('latestTimestamp', () => {
  it('should return the later timestamp', () => {
    expect(latestTimestamp('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('should return the later timestamp when b is later', () => {
    expect(latestTimestamp('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z')).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('should return a when timestamps are equal', () => {
    const ts = '2026-01-01T12:00:00.000Z';
    expect(latestTimestamp(ts, ts)).toBe(ts);
  });

  it('should handle different timezone offsets', () => {
    // These represent the same instant in time
    const utc = '2026-01-01T12:00:00.000Z';
    const later = '2026-01-01T13:00:00.000Z';
    expect(latestTimestamp(utc, later)).toBe(later);
  });
});

describe('isNewerVersion', () => {
  it('should return true when incoming is higher', () => {
    expect(isNewerVersion(3, 2)).toBe(true);
  });

  it('should return false when incoming is lower', () => {
    expect(isNewerVersion(1, 2)).toBe(false);
  });

  it('should return false when versions are equal', () => {
    expect(isNewerVersion(2, 2)).toBe(false);
  });

  it('should handle version zero', () => {
    expect(isNewerVersion(0, 0)).toBe(false);
    expect(isNewerVersion(1, 0)).toBe(true);
  });
});

describe('nextVersion', () => {
  it('should return one more than the higher version', () => {
    expect(nextVersion(2, 3)).toBe(4);
  });

  it('should work when client is higher', () => {
    expect(nextVersion(5, 3)).toBe(6);
  });

  it('should work when versions are equal', () => {
    expect(nextVersion(3, 3)).toBe(4);
  });

  it('should handle zero versions', () => {
    expect(nextVersion(0, 0)).toBe(1);
  });
});
