import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { getSitemapBaseUrl } from '@/utils/url'
import { headers } from 'next/headers'

/**
 * Atom Feed for Live Football Matches
 * 
 * Atom 1.0 feed as an alternative to RSS.
 * Some aggregators prefer Atom format.
 */

export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
    const headersList = await headers()
    const host = headersList.get('host') || undefined
    const baseUrl = getSitemapBaseUrl(host)
    const now = new Date()

    let allMatches: any[] = []

    try {
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
        console.error('Atom Feed: Error fetching matches:', error)
        allMatches = []
    }

    const atomEntries = allMatches.map((match) => {
        const kickoff = new Date(match.kickoffIso as unknown as string)
        const isLive = now >= kickoff && now <= new Date(kickoff.getTime() + 120 * 60 * 1000)
        const isPast = now > new Date(kickoff.getTime() + 120 * 60 * 1000)

        let title = `${match.homeTeam} vs ${match.awayTeam}`
        let summary = `${match.league} match`

        if (isLive) {
            title = `🔴 LIVE: ${title}`
            summary = `Watch ${match.homeTeam} vs ${match.awayTeam} live now!`
        } else if (isPast && match.homeScore !== null) {
            title = `${title}: ${match.homeScore}-${match.awayScore}`
            summary = `Final: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
        }

        return `
  <entry>
    <title><![CDATA[${title}]]></title>
    <link href="${baseUrl}/watch/${match.slug}" rel="alternate"/>
    <id>${baseUrl}/watch/${match.slug}</id>
    <updated>${kickoff.toISOString()}</updated>
    <summary><![CDATA[${summary}]]></summary>
    <category term="${match.league}"/>
    <author>
      <name>KickAI</name>
    </author>
  </entry>`
    }).join('\n')

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Live Football Matches - KickAI</title>
  <subtitle>Live football streaming, highlights, and scores</subtitle>
  <link href="${baseUrl}/feed/atom" rel="self"/>
  <link href="${baseUrl}"/>
  <id>${baseUrl}/</id>
  <updated>${now.toISOString()}</updated>
  <author>
    <name>KickAI</name>
    <uri>${baseUrl}</uri>
  </author>
  <icon>${baseUrl}/favicon.ico</icon>
  <logo>${baseUrl}/logo.png</logo>
  ${atomEntries}
</feed>`

    return new NextResponse(atom, {
        status: 200,
        headers: {
            'Content-Type': 'application/atom+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
        },
    })
}
