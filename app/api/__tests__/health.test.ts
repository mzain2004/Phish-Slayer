import { describe, it, expect, vi } from 'vitest';
import { GET } from '../health/route';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('Health API', () => {
  it('should return 200 and status ok', async () => {
    const response: any = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.status).toBe('ok');
  });
});
