'use client'

import { useEffect, useState } from 'react'

/**
 * SemanticLinks Component
 * 
 * A reusable cross-linking component that appears on every page to create
 * a dense internal linking graph. This is critical for SEO as it:
 * 1. Distributes PageRank across all pages
 * 2. Helps search engines discover related content
 * 3. Improves user engagement by showing relevant content
 * 
 * The component adapts its content based on the current page context.
 */

interface SemanticLinksProps {
    // Current context for relevance
    currentEntity?: {
        type: 'match' | 'team' | 'league' | 'player' | 'venue'
        id?: string
        slug?: string
        name?: string
    }
    // Teams involved (for match pages)
    homeTeam?: string
    awayTeam?: string
    // League context
    league?: string
    // Date context
    date?: string
    // Show related matches
    showMatches?: boolean
    // Show related teams
    showTeams?: boolean
    // Show date archives
    showDateArchives?: boolean
    // Maximum items per section
    maxItems?: number
}

// Static data for SEO - these links appear on every page
const TOP_LEAGUES = [
    { name: 'Premier League', slug: 'premier-league' },
    { name: 'Champions League', slug: 'champions-league' },
    { name: 'La Liga', slug: 'la-liga' },
    { name: 'Serie A', slug: 'serie-a' },
    { name: 'Bundesliga', slug: 'bundesliga' },
    { name: 'Ligue 1', slug: 'ligue-1' },
    { name: 'Europa League', slug: 'europa-league' },
]

const TOP_TEAMS = [
    { name: 'Manchester City', slug: 'manchester-city' },
    { name: 'Arsenal', slug: 'arsenal' },
    { name: 'Liverpool', slug: 'liverpool' },
    { name: 'Real Madrid', slug: 'real-madrid' },
    { name: 'Barcelona', slug: 'barcelona' },
    { name: 'Bayern Munich', slug: 'bayern-munich' },
    { name: 'Manchester United', slug: 'manchester-united' },
    { name: 'Chelsea', slug: 'chelsea' },
]

// Generate date archive links for the past week and next week
function generateDateArchives(): { label: string; path: string }[] {
    const archives: { label: string; path: string }[] = []
    const now = new Date()

    // Past 3 days
    for (let i = 3; i >= 1; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        archives.push({ label, path: `/matches/${yyyy}/${mm}/${dd}` })
    }

    // Today
    const today = new Date(now)
    const todayPath = `/matches/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
    archives.push({ label: 'Today', path: todayPath })

    // Next 3 days
    for (let i = 1; i <= 3; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        archives.push({ label, path: `/matches/${yyyy}/${mm}/${dd}` })
    }

    return archives
}

export default function SemanticLinks({
    currentEntity,
    homeTeam,
    awayTeam,
    league,
    showMatches = true,
    showTeams = true,
    showDateArchives = true,
    maxItems = 6,
}: SemanticLinksProps) {
    const [dateArchives, setDateArchives] = useState<{ label: string; path: string }[]>([])

    useEffect(() => {
        setDateArchives(generateDateArchives())
    }, [])

    // Filter out current entity from links
    const filteredLeagues = TOP_LEAGUES.filter(l => l.slug !== currentEntity?.slug).slice(0, maxItems)
    const filteredTeams = TOP_TEAMS.filter(t =>
        t.name !== homeTeam &&
        t.name !== awayTeam &&
        t.slug !== currentEntity?.slug
    ).slice(0, maxItems)

    return (
        <div className="bg-black-900/40 border border-gold-500/20 rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-4">
                🔗 Explore More Football
            </h3>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <a
                    href="/live"
                    className="bg-red-600/20 border border-red-500/30 rounded-xl p-3 text-center hover:bg-red-600/30 transition-all"
                >
                    <span className="text-red-400 font-bold">🔴 Live Now</span>
                </a>
                <a
                    href="/upcoming"
                    className="bg-gold-500/20 border border-gold-500/30 rounded-xl p-3 text-center hover:bg-gold-500/30 transition-all"
                >
                    <span className="text-gold-400 font-bold">📅 Upcoming</span>
                </a>
                <a
                    href="/highlights"
                    className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center hover:bg-blue-500/30 transition-all"
                >
                    <span className="text-blue-400 font-bold">🎬 Highlights</span>
                </a>
                <a
                    href="/players/trending"
                    className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 text-center hover:bg-purple-500/30 transition-all"
                >
                    <span className="text-purple-400 font-bold">⭐ Trending</span>
                </a>
            </div>

            {/* Date Archives */}
            {showDateArchives && dateArchives.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                        📆 Match Archives
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {dateArchives.map((archive) => (
                            <a
                                key={archive.path}
                                href={archive.path}
                                className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gold-500/50 transition-all"
                            >
                                {archive.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Leagues */}
            <div className="mb-6">
                <h4 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                    🏆 Top Leagues
                </h4>
                <div className="flex flex-wrap gap-2">
                    {filteredLeagues.map((leagueItem) => (
                        <a
                            key={leagueItem.slug}
                            href={`/leagues/${leagueItem.slug}`}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${league === leagueItem.name
                                    ? 'bg-gold-500 text-black font-bold'
                                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gold-500/50'
                                }`}
                        >
                            {leagueItem.name}
                        </a>
                    ))}
                    <a
                        href="/leagues"
                        className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gold-400 hover:bg-gold-500/20 transition-all"
                    >
                        View All →
                    </a>
                </div>
            </div>

            {/* Top Teams */}
            {showTeams && (
                <div className="mb-6">
                    <h4 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                        ⚽ Popular Teams
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {filteredTeams.map((team) => (
                            <a
                                key={team.slug}
                                href={`/teams/${team.slug}`}
                                className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gold-500/50 transition-all"
                            >
                                {team.name}
                            </a>
                        ))}
                        <a
                            href="/teams"
                            className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gold-400 hover:bg-gold-500/20 transition-all"
                        >
                            View All →
                        </a>
                    </div>
                </div>
            )}

            {/* Related Team Links (for match pages) */}
            {(homeTeam || awayTeam) && (
                <div>
                    <h4 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                        🔍 Related Teams
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {homeTeam && (
                            <a
                                href={`/teams/${homeTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-600/30 transition-all"
                            >
                                {homeTeam} Fixtures
                            </a>
                        )}
                        {awayTeam && (
                            <a
                                href={`/teams/${awayTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-600/30 transition-all"
                            >
                                {awayTeam} Fixtures
                            </a>
                        )}
                        {homeTeam && awayTeam && (
                            <a
                                href={`/teams/${homeTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/vs/${awayTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                className="px-3 py-1.5 bg-gold-500/20 border border-gold-500/30 rounded-lg text-sm text-gold-400 hover:bg-gold-500/30 transition-all"
                            >
                                Head to Head →
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
