import { Metadata } from 'next'
import { db } from '@/db/client'
import { venues } from '@/db/schema'
import { sql } from 'drizzle-orm'
import Link from 'next/link'
import SemanticLinks from '@/components/SemanticLinks'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Football Stadiums & Venues | World Football Venues | Kick AI',
    description: 'Browse football stadiums and venues worldwide. Find stadium capacity, location, surface type, and upcoming matches. Premier League, Champions League, La Liga venues.',
    keywords: 'football stadiums, soccer venues, stadium capacity, Premier League stadiums, Champions League venues, football grounds',
}

export default async function VenuesIndexPage() {
    let allVenues: any[] = []

    try {
        allVenues = await db.select({
            slug: venues.slug,
            name: venues.name,
            city: venues.city,
            country: venues.country,
            capacity: venues.capacity,
            surface: venues.surface,
            imageUrl: venues.imageUrl,
        })
            .from(venues)
            .orderBy(sql`capacity DESC NULLS LAST`)
            .limit(200)
    } catch (error) {
        console.error('Error fetching venues:', error)
    }

    // Group venues by country
    const venuesByCountry = allVenues.reduce((acc, venue) => {
        const country = venue.country || 'Other'
        if (!acc[country]) acc[country] = []
        acc[country].push(venue)
        return acc
    }, {} as Record<string, any[]>)

    const countries = Object.keys(venuesByCountry).sort()

    return (
        <div className="min-h-screen bg-black">
            {/* Hero */}
            <div className="bg-gradient-to-b from-gold-600/20 to-black py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        🏟️ Football <span className="text-gold-400">Stadiums</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Explore football venues worldwide. Stadium info, capacity, and upcoming matches.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-6xl mx-auto px-4 -mt-8">
                <div className="grid grid-cols-3 gap-4 mb-12">
                    <div className="bg-black-900/60 border border-gold-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                        <div className="text-3xl font-black text-gold-400">{allVenues.length}</div>
                        <div className="text-gray-400 text-sm">Stadiums</div>
                    </div>
                    <div className="bg-black-900/60 border border-gold-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                        <div className="text-3xl font-black text-green-400">{countries.length}</div>
                        <div className="text-gray-400 text-sm">Countries</div>
                    </div>
                    <div className="bg-black-900/60 border border-gold-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                        <div className="text-3xl font-black text-blue-400">
                            {allVenues.reduce((sum, v) => sum + (v.capacity || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">Total Capacity</div>
                    </div>
                </div>
            </div>

            {/* Venue List */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {allVenues.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🏟️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Stadiums Yet</h2>
                        <p className="text-gray-400">Stadium data is being populated. Check back soon!</p>
                    </div>
                ) : (
                    <>
                        {/* Top Stadiums by Capacity */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">🏆 Largest Stadiums</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allVenues.slice(0, 12).map((venue) => (
                                    <Link
                                        key={venue.slug}
                                        href={`/venues/${venue.slug}`}
                                        className="group bg-black-900/40 border border-white/10 rounded-xl p-4 hover:border-gold-500/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
                                                {venue.name}
                                            </h3>
                                            {venue.capacity && (
                                                <span className="bg-gold-500/20 text-gold-400 px-2 py-1 rounded text-sm font-bold">
                                                    {venue.capacity.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {venue.city}{venue.country ? `, ${venue.country}` : ''}
                                        </div>
                                        {venue.surface && (
                                            <div className="text-gray-500 text-xs mt-1 capitalize">{venue.surface}</div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Venues by Country */}
                        {countries.map((country) => (
                            <div key={country} className="mb-8">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    🌍 {country} ({venuesByCountry[country].length})
                                </h2>
                                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {venuesByCountry[country].slice(0, 8).map((venue: any) => (
                                        <Link
                                            key={venue.slug}
                                            href={`/venues/${venue.slug}`}
                                            className="bg-black-900/40 border border-white/10 rounded-lg p-3 hover:border-gold-500/30 transition-all"
                                        >
                                            <div className="text-white font-semibold truncate">{venue.name}</div>
                                            <div className="text-gray-500 text-xs">{venue.city}</div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* SEO Crosslinks */}
                <SemanticLinks showTeams={true} showDateArchives={true} />
            </div>
        </div>
    )
}
