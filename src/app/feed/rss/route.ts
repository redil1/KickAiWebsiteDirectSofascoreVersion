import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { getSitemapBaseUrl } from '@/utils/url'
import { headers } from 'next/headers'

/**
 * RSS Feed for Live Football Matches
 * 
 * RSS 2.0 feed for match updates, compatible with:
 * - Google News
 * - RSS readers
 * - Podcast apps (for audio content)
 * - Social media aggregators
 * 
 * This dramatically improves content discovery and indexation speed.
 */

export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
    const headersList = await headers()
    const host = headersList.get('host') || undefined
    const baseUrl = getSitemapBaseUrl(host)
    const now = new Date()

    let allMatches: any[] = []

    try {
        // Get recent and upcoming matches
        allMatches = await db.select({
            slug: matches.slug,
            homeTeam: matches.homeTeam,
            awayTeam: matches.awayTeam,
            league: matches.league,
            kickoffIso: matches.kickoffIso,
            status: matches.status,
            homeScore: matches.homeScore,
            awayScore: matches.awayScore,
        })
            .from(matches)
            .orderBy(sql`kickoff_iso DESC`)
            .limit(100)
    } catch (error) {
        console.error('RSS Feed: Error fetching matches:', error)
        allMatches = []
    }

    // Build RSS XML
    const rssItems = allMatches.map((match) => {
        const kickoff = new Date(match.kickoffIso as unknown as string)
        const isLive = now >= kickoff && now <= new Date(kickoff.getTime() + 120 * 60 * 1000)
        const isPast = now > new Date(kickoff.getTime() + 120 * 60 * 1000)

        let title = `${match.homeTeam} vs ${match.awayTeam}`
        let description = `${match.league} match`

        if (isLive) {
            title = `🔴 LIVE: ${title}`
            description = `Watch ${match.homeTeam} vs ${match.awayTeam} live now in the ${match.league}!`
        } else if (isPast && match.homeScore !== null) {
            title = `${title}: ${match.homeScore}-${match.awayScore}`
            description = `Final score: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}. Watch highlights now.`
        } else {
            description = `Upcoming ${match.league} match. ${match.homeTeam} vs ${match.awayTeam} on ${kickoff.toLocaleDateString()}.`
        }

        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${baseUrl}/watch/${match.slug}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${kickoff.toUTCString()}</pubDate>
      <guid isPermaLink="true">${baseUrl}/watch/${match.slug}</guid>
      <category>${match.league}</category>
    </item>`
    }).join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Live Football Matches - KickAI</title>
    <link>${baseUrl}</link>
    <description>Live football match streaming, highlights, and scores from Premier League, Champions League, La Liga, and more.</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>KickAI Live Football</title>
      <link>${baseUrl}</link>
    </image>
    <category>Sports</category>
    <category>Football</category>
    <category>Soccer</category>
    <ttl>5</ttl>
    ${rssItems}
  </channel>
</rss>`

    return new NextResponse(rss, {
        status: 200,
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300', // 5 minute cache
        },
    })
}
