import { type NextRequest, NextResponse } from 'next/server';

export function updateSession(request: NextRequest) {
  // Middleware must always return immediately. Authentication and authorization
  // are verified in server pages and route handlers instead of making every
  // request depend on an external Auth API call at the routing layer.
  return NextResponse.next({ request });
}
