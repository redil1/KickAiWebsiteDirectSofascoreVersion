import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { venues } from '@/db/schema'
import { getSitemapBaseUrl } from '@/utils/url'

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const headersList = await headers()
    const host = headersList.get('host') || undefined
    const base = getSitemapBaseUrl(host)
    const now = new Date()

    const entries: MetadataRoute.Sitemap = []

    try {
        // Add venues index
        entries.push({
            url: `${base}/venues`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        })

        // Get all venues
        const allVenues = await db.select({
            slug: venues.slug,
            updatedAt: venues.updatedAt,
        }).from(venues)

        console.log(`Venues Sitemap: Found ${allVenues.length} venues`)

        allVenues.forEach((venue) => {
            entries.push({
                url: `${base}/venues/${venue.slug}`,
                lastModified: venue.updatedAt || now,
                changeFrequency: 'weekly',
                priority: 0.6,
            })
        })
    } catch (error) {
        console.error('Venues Sitemap: Error fetching venues:', error)
    }

    return entries
}
