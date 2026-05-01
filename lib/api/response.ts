import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, meta?: object) {
  return NextResponse.json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }, { status: 200 });
}

export function apiError(code: string, message: string, status: number, details?: any) {
  return NextResponse.json({
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }, { status });
}

export function apiPaginated<T>(items: T[], total: number, page: number, limit: number) {
  const pages = Math.ceil(total / limit);
  const has_next = page < pages - 1;

  return NextResponse.json({
    data: items,
    pagination: {
      total,
      page,
      limit,
      pages,
      has_next
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }, { status: 200 });
}

export const API_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
