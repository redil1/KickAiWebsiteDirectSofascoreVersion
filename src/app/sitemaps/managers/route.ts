import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { managers } from '@/db/schema'
import { getSitemapBaseUrl } from '@/utils/url'

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const headersList = await headers()
    const host = headersList.get('host') || undefined
    const base = getSitemapBaseUrl(host)
    const now = new Date()

    const entries: MetadataRoute.Sitemap = []

    try {
        // Add managers index
        entries.push({
            url: `${base}/managers`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        })

        // Get all managers
        const allManagers = await db.select({
            slug: managers.slug,
            updatedAt: managers.updatedAt,
        }).from(managers)

        console.log(`Managers Sitemap: Found ${allManagers.length} managers`)

        allManagers.forEach((manager) => {
            entries.push({
                url: `${base}/managers/${manager.slug}`,
                lastModified: manager.updatedAt || now,
                changeFrequency: 'weekly',
                priority: 0.6,
            })
        })
    } catch (error) {
        console.error('Managers Sitemap: Error fetching managers:', error)
    }

    return entries
}
