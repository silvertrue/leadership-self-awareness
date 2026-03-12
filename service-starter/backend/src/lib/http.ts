import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function withCookie(response: NextResponse, cookie: string): NextResponse {
  response.headers.append('Set-Cookie', cookie);
  return response;
}
