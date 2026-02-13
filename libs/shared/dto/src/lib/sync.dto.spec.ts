import { describe, expect, it } from 'vitest';
import { CONFLICT_RESOLUTION_STRATEGIES } from './sync.dto';

describe('shared dto sync exports', () => {
  it('should expose conflict resolution strategies for API and POS', () => {
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('MANUAL');
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('SERVER_WINS');
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('CLIENT_WINS');
  });
});
