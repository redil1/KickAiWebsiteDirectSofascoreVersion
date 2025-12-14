import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { getSitemapBaseUrl } from '@/utils/url'

// Force regeneration every 60 seconds
export const revalidate = 60

interface VideoSitemapEntry {
    url: string
    video: {
        title: string
        description: string
        contentUrl?: string
        thumbnailUrl: string
        duration?: number
        publicationDate?: string
        live?: boolean
        tags?: string[]
        category?: string
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const headersList = await headers()
    const host = headersList.get('host') || undefined
    const base = getSitemapBaseUrl(host)
    const now = new Date()

    const entries: MetadataRoute.Sitemap = []

    try {
        // Get matches with video content (scorebat embeds)
        console.log('Video Sitemap: Fetching matches with video embeds...')
        const allMatches = await db.select({
            slug: matches.slug,
            homeTeam: matches.homeTeam,
            awayTeam: matches.awayTeam,
            league: matches.league,
            kickoffIso: matches.kickoffIso,
            scorebatEmbed: matches.scorebatEmbed,
            eventId: matches.eventId,
        }).from(matches)

        console.log(`Video Sitemap: Found ${allMatches.length} total matches`)

        // Filter matches with video content
        const matchesWithVideo = allMatches.filter(m => m.scorebatEmbed && m.scorebatEmbed.length > 0)
        console.log(`Video Sitemap: ${matchesWithVideo.length} matches with video content`)

        matchesWithVideo.forEach((match) => {
            const kickoffDate = match.kickoffIso as unknown as string | Date
            const kickoff = typeof kickoffDate === 'string' ? new Date(kickoffDate) : kickoffDate
            const isLive = now >= kickoff && now <= new Date(kickoff.getTime() + 120 * 60 * 1000)
            const isToday = kickoff.toISOString().split('T')[0] === now.toISOString().split('T')[0]

            // Dynamic priority based on recency
            let priority = 0.6
            let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' = 'weekly'

            if (isLive) {
                priority = 0.95
                changeFrequency = 'always'
            } else if (isToday) {
                priority = 0.9
                changeFrequency = 'hourly'
            } else {
                // Recency boost for recent matches
                const daysSinceMatch = (now.getTime() - kickoff.getTime()) / (1000 * 60 * 60 * 24)
                if (daysSinceMatch <= 7) {
                    priority = 0.8
                    changeFrequency = 'daily'
                }
            }

            // Watch page with highlights
            entries.push({
                url: `${base}/watch/${match.slug}`,
                lastModified: isLive ? now : kickoff,
                changeFrequency,
                priority,
            })

            // Event page if eventId exists
            if (match.eventId) {
                entries.push({
                    url: `${base}/m/${match.eventId}-${match.slug}`,
                    lastModified: isLive ? now : kickoff,
                    changeFrequency,
                    priority: Math.min(priority + 0.05, 1.0),
                })
            }
        })
    } catch (error) {
        console.error('Video Sitemap: Error fetching matches:', error)
    }

    // Add highlights index page
    entries.push({
        url: `${base}/highlights`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.85,
    })

    return entries.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}
