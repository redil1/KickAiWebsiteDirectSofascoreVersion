import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const teamId = url.searchParams.get('team_id')

  if (!teamId || !/^\d+$/.test(teamId)) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  try {
    const { gotScraping } = await import('got-scraping')
    const target = `https://api.sofascore.app/api/v1/team/${teamId}/image`

    const r = await gotScraping({
      url: target,
      responseType: 'buffer',
      timeout: { request: 15_000 },
      headerGeneratorOptions: {
        browsers: [{ name: 'chrome', minVersion: 130 }],
        devices: ['desktop'],
        locales: ['en-US'],
        operatingSystems: ['windows'],
      },
    })

    const contentType = String(r.headers['content-type'] || 'image/png')
    return new NextResponse(r.rawBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (e: any) {
    const status = e?.response?.statusCode
    if (status === 404) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    return NextResponse.json({ ok: false, error: 'upstream_failed' }, { status: 502 })
  }
}

