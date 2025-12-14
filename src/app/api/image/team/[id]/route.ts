import { NextRequest, NextResponse } from 'next/server'

const LEGACY_API = process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    try {
        const imageUrl = `${LEGACY_API}/images/team/download/full?team_id=${id}`
        const response = await fetch(imageUrl, {
            headers: {
                'Accept': 'image/*',
            },
            // Cache for 24 hours
            next: { revalidate: 86400 }
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch image' },
                { status: response.status }
            )
        }

        const imageBuffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || 'image/png'

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            }
        })
    } catch (error) {
        console.error('Team image proxy error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
