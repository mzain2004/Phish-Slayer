'use server';

import {
  getEndpointEvents as _getEndpointEvents,
  getEndpointStats as _getEndpointStats,
  getRecentCriticalEvents as _getRecentCriticalEvents,
} from '@/lib/supabase/agentQueries';

export async function getEndpointEvents(limit = 100) {
  return _getEndpointEvents(limit);
}

export async function getEndpointStats() {
  return _getEndpointStats();
}

export async function getRecentCriticalEvents(limit = 5) {
  return _getRecentCriticalEvents(limit);
}
