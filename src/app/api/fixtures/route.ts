import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/middleware.rate-limit'
import { sofascoreService } from '@/services/sofascore'

// Proxy for custom football API
export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req)
  if (limited) return limited
  const url = new URL(req.url)
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  // Use direct Sofascore API
  const json = await sofascoreService.getScheduledEvents(date) || { events: [] }

  const res = NextResponse.json(json, { status: 200 })
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return res
}
