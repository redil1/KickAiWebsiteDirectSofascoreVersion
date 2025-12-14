import { Metadata } from 'next'
import { db } from '@/db/client'
import { matches, tournaments } from '@/db/schema'
import { eq, sql, and, gte, lt } from 'drizzle-orm'
import { getBaseUrl } from '@/utils/url'
import Link from 'next/link'
import { format } from 'date-fns'
import SemanticLinks from '@/components/SemanticLinks'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string; week: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, week } = await params
    const weekNum = parseInt(week, 10)

    // Get tournament info
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1)

    const leagueName = tournament?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const title = `${leagueName} Matchweek ${weekNum} - Fixtures & Results | Kick AI`
    const description = `${leagueName} Matchweek ${weekNum} fixtures, results, and live streams. All matches from week ${weekNum} of the ${leagueName} season.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
        },
    }
}

export default async function MatchWeekPage({ params }: PageProps) {
    const { slug, week } = await params
    const weekNum = parseInt(week, 10)

    // Get tournament info
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1)

    const leagueName = tournament?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    // Get matches for this league
    // Note: Actual week calculation would require season start date
    // For now, we'll show matches from the league
    let weekMatches: any[] = []

    try {
        weekMatches = await db.select({
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
            .where(sql`LOWER(league) LIKE LOWER(${'%' + leagueName + '%'})`)
            .orderBy(sql`kickoff_iso ASC`)
            .limit(20)
    } catch (error) {
        console.error('Error fetching match week:', error)
    }

    const baseUrl = getBaseUrl()

    // Structured data for SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${leagueName} Matchweek ${weekNum}`,
        description: `All fixtures and results from Matchweek ${weekNum} of ${leagueName}`,
        url: `${baseUrl}/leagues/${slug}/week/${week}`,
        sport: 'Football',
        eventStatus: 'https://schema.org/EventScheduled',
    }

    return (
        <div className="min-h-screen bg-black">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Hero */}
            <div className="bg-gradient-to-b from-gold-600/20 to-black py-12">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Link href="/leagues" className="hover:text-white">Leagues</Link>
                        <span>/</span>
                        <Link href={`/leagues/${slug}`} className="hover:text-white">{leagueName}</Link>
                        <span>/</span>
                        <span className="text-white">Week {weekNum}</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                        {leagueName}
                    </h1>
                    <p className="text-xl text-gold-400">
                        ⚽ Matchweek {weekNum}
                    </p>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="max-w-6xl mx-auto px-4 -mt-4">
                <div className="flex items-center justify-center gap-4 p-4 bg-black-900/60 border border-white/10 rounded-xl">
                    {weekNum > 1 && (
                        <Link
                            href={`/leagues/${slug}/week/${weekNum - 1}`}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Week {weekNum - 1}
                        </Link>
                    )}
                    <span className="text-xl font-bold text-gold-400">Week {weekNum}</span>
                    {weekNum < 38 && (
                        <Link
                            href={`/leagues/${slug}/week/${weekNum + 1}`}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Week {weekNum + 1} →
                        </Link>
                    )}
                </div>
            </div>

            {/* Matches */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                {weekMatches.length === 0 ? (
                    <div className="text-center py-16 bg-black-900/40 border border-white/10 rounded-2xl">
                        <div className="text-6xl mb-4">📅</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Matches Found</h2>
                        <p className="text-gray-400 mb-4">No matches scheduled for this matchweek yet.</p>
                        <Link href={`/leagues/${slug}`} className="text-gold-400 hover:text-gold-300">
                            View all {leagueName} matches →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {weekMatches.map((match) => {
                            const kickoff = new Date(match.kickoffIso as unknown as string)
                            const isPast = new Date() > kickoff
                            const hasScore = match.homeScore !== null && match.awayScore !== null

                            return (
                                <Link
                                    key={match.slug}
                                    href={`/watch/${match.slug}`}
                                    className="block bg-black-900/40 border border-white/10 rounded-xl p-6 hover:border-gold-500/50 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="text-lg font-bold text-white">{match.homeTeam}</span>
                                                {hasScore ? (
                                                    <span className="text-2xl font-black text-gold-400">
                                                        {match.homeScore} - {match.awayScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-2xl font-black text-gray-500">vs</span>
                                                )}
                                                <span className="text-lg font-bold text-white">{match.awayTeam}</span>
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {format(kickoff, 'EEE, MMM d yyyy • HH:mm')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isPast && hasScore ? (
                                                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                                                    Full Time
                                                </span>
                                            ) : isPast ? (
                                                <span className="bg-gold-500/20 text-gold-400 px-3 py-1 rounded-full text-sm">
                                                    Highlights
                                                </span>
                                            ) : (
                                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                                                    Upcoming
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* Other Weeks */}
                <div className="mt-12 bg-black-900/40 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">📅 Other Matchweeks</h2>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 38 }, (_, i) => i + 1).map((w) => (
                            <Link
                                key={w}
                                href={`/leagues/${slug}/week/${w}`}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${w === weekNum
                                        ? 'bg-gold-500 text-black'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {w}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* SEO Crosslinks */}
                <SemanticLinks
                    currentEntity={{ type: 'league', slug, name: leagueName }}
                    league={leagueName}
                    showTeams={true}
                    showDateArchives={true}
                />
            </div>
        </div>
    )
}
