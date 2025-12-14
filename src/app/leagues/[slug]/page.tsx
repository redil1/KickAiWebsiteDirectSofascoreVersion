import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sofascoreService } from '@/services/sofascore'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import MetricBeacon from '@/components/MetricBeacon'
import { Metadata } from 'next'
import Script from 'next/script'

// Revalidate every hour
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

// Helper to get cached tournament data from database
async function getCachedTournament(slug: string) {
  try {
    const result = await db.execute(sql`
      SELECT t.*, ts.standings, ts.season_id as standings_season_id
      FROM tournaments t
      LEFT JOIN tournament_standings ts ON t.tournament_id = ts.tournament_id AND t.current_season_id = ts.season_id
      WHERE t.slug = ${slug}
      AND t.updated_at > NOW() - INTERVAL '6 hours'
    `)
    return (result as any).rows?.[0] || null
  } catch (err) {
    console.error('Error fetching cached tournament:', err)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Try database cache first
  const cached = await getCachedTournament(slug)
  let name = cached?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // If not cached, try live API
  if (!cached) {
    const tournamentId = await sofascoreService.resolveTournamentId(slug)
    if (tournamentId) {
      const details = await sofascoreService.getTournamentDetails(tournamentId)
      if ((details as any)?.uniqueTournament?.name) {
        name = (details as any).uniqueTournament.name
      }
    }
  }

  const title = `${name} Standings, Fixtures & Live Streaming`

  return {
    title,
    description: `Watch live ${name} football matches. Get fixtures, scores, results and standings for the 2024/25 season.`,
    alternates: {
      canonical: `/leagues/${slug}`
    }
  }
}

export default async function LeaguePage({ params }: PageProps) {
  const { slug } = await params

  // 1. Try database cache first (instant)
  const cached = await getCachedTournament(slug)

  let tournamentId: string | null = null
  let leagueName: string
  let leagueImage: string | null
  let standings: any[] = []

  if (cached) {
    // Use cached data (fast path)
    tournamentId = cached.tournament_id
    leagueName = cached.name
    leagueImage = cached.logo_url
    standings = cached.standings?.[0]?.rows || []
  } else {
    // Fallback to live API (slow path)
    tournamentId = await sofascoreService.resolveTournamentId(slug)

    if (!tournamentId) {
      // If we can't resolve the tournament, show 404
      return notFound()
    }

    // Sequential fetch to avoid overloading legacy API server
    const tournamentDetailsData = await sofascoreService.getTournamentDetails(tournamentId)
    const seasonsData = await sofascoreService.getTournamentSeasons(tournamentId)

    const tournamentDetails = (tournamentDetailsData as any)?.uniqueTournament || null
    leagueName = tournamentDetails?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    leagueImage = `https://api.sofascore.app/api/v1/unique-tournament/${tournamentId}/image`

    // Fetch standings
    if (seasonsData) {
      const seasons = (seasonsData as any)?.seasons || []
      const currentSeason = seasons[1] || seasons[0]
      if (currentSeason?.id) {
        const standingsData = await sofascoreService.getStandings(tournamentId, String(currentSeason.id))
        if (standingsData && (standingsData as any).standings) {
          standings = (standingsData as any).standings?.[0]?.rows || []
        }
      }
    }
  }

  // Schema markup
  const leagueSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: leagueName,
    sport: 'Soccer',
    logo: leagueImage,
    url: `https://kickaiofmatches.com/leagues/${slug}`
  }

  return (
    <div className="min-h-screen bg-black-900 text-white">
      <MetricBeacon event="league_view" />
      <Script id="league-schema" type="application/ld+json">
        {JSON.stringify(leagueSchema)}
      </Script>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black-800 to-black-900 py-16 px-4 border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {leagueImage && (
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl p-3 shadow-2xl">
              <img src={leagueImage} alt={leagueName} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black mb-2">
              <span className="text-gold-500">{leagueName}</span>
            </h1>
            <p className="text-xl text-gray-400">
              Standings, fixtures, and live streaming
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">

          {/* Standings Table */}
          {standings.length > 0 && (
            <section className="bg-black-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-white">Standings 2024/25</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-400 bg-black-800">
                    <tr>
                      <th className="p-3 text-center">#</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">W</th>
                      <th className="p-3 text-center">D</th>
                      <th className="p-3 text-center">L</th>
                      <th className="p-3 text-center">GD</th>
                      <th className="p-3 text-center font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row: any, i: number) => (
                      <tr key={i} className={`border-t border-gray-700/30 hover:bg-white/5 ${i < 4 ? 'bg-green-900/10' : i >= standings.length - 3 ? 'bg-red-900/10' : ''}`}>
                        <td className="p-3 text-center text-gray-400 font-medium">{row.position}</td>
                        <td className="p-3">
                          <Link href={`/teams/${row.team?.slug || row.team?.id}`} className="flex items-center gap-2 text-white hover:text-gold-400">
                            {row.team?.id && (
                              <img src={`${process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004'}/images/team/download/full?team_id=${row.team.id}`} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span className="font-medium">{row.team?.name}</span>
                          </Link>
                        </td>
                        <td className="p-3 text-center text-gray-300">{row.matches}</td>
                        <td className="p-3 text-center text-green-400">{row.wins}</td>
                        <td className="p-3 text-center text-gray-400">{row.draws}</td>
                        <td className="p-3 text-center text-red-400">{row.losses}</td>
                        <td className="p-3 text-center text-gray-300">{row.scoresFor - row.scoresAgainst > 0 ? '+' : ''}{row.scoresFor - row.scoresAgainst}</td>
                        <td className="p-3 text-center font-bold text-white">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* If no standings, show placeholder */}
          {standings.length === 0 && (
            <section className="bg-black-800/50 rounded-xl border border-gray-700/50 p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Standings</h2>
              <p className="text-gray-400">
                Standings for this league are currently unavailable.
                Check our <Link href="/matches" className="text-gold-400 hover:underline">Matches Page</Link> for fixtures.
              </p>
            </section>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Teams */}
          {standings.length > 0 && (
            <div className="bg-black-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-bold text-white mb-4">🏆 Top 5 Teams</h3>
              <ul className="space-y-3">
                {standings.slice(0, 5).map((row: any, i: number) => (
                  <li key={i}>
                    <Link href={`/teams/${row.team?.slug || row.team?.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition">
                      <span className="text-gold-500 font-bold w-5">{i + 1}</span>
                      {row.team?.id && (
                        <img src={`${process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004'}/images/team/download/full?team_id=${row.team.id}`} alt="" className="w-6 h-6 object-contain" />
                      )}
                      <span className="text-white">{row.team?.name}</span>
                      <span className="ml-auto text-gray-400 text-sm">{row.points} pts</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-black-800 rounded-xl p-5 border border-gray-700">
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="block p-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">🏠 Home</Link></li>
              <li><Link href="/matches" className="block p-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">⚽ All Matches</Link></li>
              <li><Link href="/teams" className="block p-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">🏟️ Teams</Link></li>
              <li><Link href="/pricing" className="block p-2 rounded hover:bg-white/5 text-gold-400 hover:text-gold-300 font-medium">💎 Premium Access</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
