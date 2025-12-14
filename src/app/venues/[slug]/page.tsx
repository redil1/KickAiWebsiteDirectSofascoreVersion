import { Metadata } from 'next'
import { db } from '@/db/client'
import { venues, matches } from '@/db/schema'
import { eq, sql, or, and, gte } from 'drizzle-orm'
import { getBaseUrl } from '@/utils/url'
import Link from 'next/link'
import SemanticLinks from '@/components/SemanticLinks'

// Force dynamic for fresh data
export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

// Generate SEO metadata for venue page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params
    const [venue] = await db.select().from(venues).where(eq(venues.slug, resolvedParams.slug)).limit(1)

    if (!venue) {
        return {
            title: 'Stadium Not Found | Kick AI',
            description: 'The requested stadium could not be found. Browse our football venues and matches.'
        }
    }

    const baseUrl = getBaseUrl()
    const title = `${venue.name} - Stadium Info, Matches & Capacity | Kick AI`
    const description = `${venue.name} stadium in ${venue.city}, ${venue.country}. Capacity: ${venue.capacity?.toLocaleString() || 'N/A'}. View upcoming matches and live streams at this venue.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${baseUrl}/venues/${venue.slug}`,
            type: 'website',
            images: venue.imageUrl ? [{ url: venue.imageUrl, width: 1200, height: 630 }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    }
}

export default async function VenuePage({ params }: PageProps) {
    const resolvedParams = await params
    const [venue] = await db.select().from(venues).where(eq(venues.slug, resolvedParams.slug)).limit(1)

    if (!venue) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Stadium Not Found</h1>
                    <p className="text-gray-400 mb-8">The stadium you're looking for doesn't exist.</p>
                    <Link href="/venues" className="bg-gold-500 text-black px-6 py-3 rounded-lg font-bold">
                        Browse All Stadiums
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch matches at this venue (by checking if venue name is in the match data)
    // Note: This is a simplified version - ideally matches would have venue_id
    const now = new Date()
    let upcomingMatches: any[] = []
    let pastMatches: any[] = []

    try {
        // For now, we'll leave matches empty until venue_id is populated in matches
        // This can be enhanced when match data includes venue information
    } catch (error) {
        console.error('Error fetching venue matches:', error)
    }

    const baseUrl = getBaseUrl()

    // Structured data for SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'StadiumOrArena',
        name: venue.name,
        address: {
            '@type': 'PostalAddress',
            addressLocality: venue.city,
            addressCountry: venue.country,
            streetAddress: venue.address,
        },
        geo: venue.latitude && venue.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: venue.latitude,
            longitude: venue.longitude,
        } : undefined,
        maximumAttendeeCapacity: venue.capacity,
        image: venue.imageUrl,
        url: `${baseUrl}/venues/${venue.slug}`,
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Hero Section */}
            <div className="relative">
                {venue.imageUrl ? (
                    <div
                        className="h-64 md:h-80 bg-cover bg-center"
                        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(${venue.imageUrl})` }}
                    />
                ) : (
                    <div className="h-64 md:h-80 bg-gradient-to-b from-gold-600/20 to-black" />
                )}

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-2 text-gold-400 mb-2">
                            <span>🏟️</span>
                            <span className="text-sm font-semibold uppercase tracking-wider">Stadium</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
                            {venue.name}
                        </h1>
                        <p className="text-xl text-gray-300">
                            {venue.city}{venue.country ? `, ${venue.country}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-black-900/40 border border-gold-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl font-black text-gold-400">
                            {venue.capacity?.toLocaleString() || '—'}
                        </div>
                        <div className="text-gray-400 text-sm">Capacity</div>
                    </div>
                    <div className="bg-black-900/40 border border-gold-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl font-black text-green-400 capitalize">
                            {venue.surface || '—'}
                        </div>
                        <div className="text-gray-400 text-sm">Surface</div>
                    </div>
                    <div className="bg-black-900/40 border border-gold-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl font-black text-blue-400">
                            {venue.city || '—'}
                        </div>
                        <div className="text-gray-400 text-sm">City</div>
                    </div>
                    <div className="bg-black-900/40 border border-gold-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl font-black text-purple-400">
                            {venue.country || '—'}
                        </div>
                        <div className="text-gray-400 text-sm">Country</div>
                    </div>
                </div>

                {/* Venue Information */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-black-900/40 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">📍 Location</h2>
                        <div className="space-y-3">
                            {venue.address && (
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-400">Address:</span>
                                    <span className="text-white">{venue.address}</span>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <span className="text-gray-400">City:</span>
                                <span className="text-white">{venue.city || 'Unknown'}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-gray-400">Country:</span>
                                <span className="text-white">{venue.country || 'Unknown'}</span>
                            </div>
                            {venue.latitude && venue.longitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 mt-4"
                                >
                                    🗺️ View on Google Maps →
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="bg-black-900/40 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">⚽ Stadium Info</h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-gray-400">Capacity:</span>
                                <span className="text-white">{venue.capacity?.toLocaleString() || 'Unknown'}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-gray-400">Surface:</span>
                                <span className="text-white capitalize">{venue.surface || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Matches at this Venue */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">📅 Upcoming Matches</h2>
                    {upcomingMatches.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {upcomingMatches.map((match, idx) => (
                                <Link
                                    key={idx}
                                    href={`/watch/${match.slug}`}
                                    className="bg-black-900/40 border border-white/10 rounded-xl p-4 hover:border-gold-500/50 transition-all"
                                >
                                    <div className="text-white font-bold">{match.homeTeam} vs {match.awayTeam}</div>
                                    <div className="text-gray-400 text-sm">{match.league}</div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-black-900/40 border border-white/10 rounded-xl p-8 text-center">
                            <p className="text-gray-400">No upcoming matches scheduled at this venue.</p>
                            <Link href="/upcoming" className="text-gold-400 hover:text-gold-300 mt-2 inline-block">
                                Browse all upcoming matches →
                            </Link>
                        </div>
                    )}
                </div>

                {/* SEO: Cross-linking */}
                <SemanticLinks
                    currentEntity={{ type: 'venue', slug: venue.slug, name: venue.name }}
                    showTeams={true}
                    showDateArchives={true}
                />
            </div>
        </div>
    )
}
