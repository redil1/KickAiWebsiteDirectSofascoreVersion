import { NextResponse } from 'next/server'
import { INDEXNOW_KEY } from '@/lib/indexnow'

/**
 * IndexNow Key Verification Endpoint
 * 
 * Search engines verify ownership by fetching /{key}.txt
 * This route dynamically serves the key content.
 * 
 * URL: https://live.iptv.shopping/kickai-indexnow-key-2025.txt
 */
export async function GET() {
    return new NextResponse(INDEXNOW_KEY, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
    })
}
