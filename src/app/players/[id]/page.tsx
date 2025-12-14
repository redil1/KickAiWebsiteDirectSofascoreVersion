import { Metadata } from 'next'
import { sofascoreService } from '@/services/sofascore'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'

export const revalidate = 3600 // Revalidate every hour

// Helper to parse ID from slug (e.g., "messi-123" -> 123)
function parseId(slug: string): string {
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const playerId = parseId(id)

  // Quick fetch for metadata
  const player = await sofascoreService.getPlayer(playerId)
  const name = player?.name || `Player ${playerId}`
  const team = player?.team?.name || 'Football'

  return {
    title: `${name} - Player Profile, Stats & Transfers`,
    description: `Detailed profile of ${name} (${team}). View stats, transfer history, and player rating.`,
    alternates: {
      canonical: `/players/${id}`
    },
    openGraph: {
      title: `${name} - Player Profile`,
      description: `Detailed statistics and transfer history for ${name}.`,
      images: [`https://api.sofascore.app/api/v1/player/${playerId}/image`]
    }
  }
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const playerId = parseId(id)

  // 1. Fetch Live Data
  const [player, transfers] = await Promise.all([
    sofascoreService.getPlayer(playerId),
    sofascoreService.getPlayerTransfers(playerId)
  ])

  if (!player) {
    return <div className="p-8 text-center text-red-500">Player profile not found.</div>
  }

  // 2. Prepare Data
  const teamName = player.team?.name
  const teamSlug = teamName ? teamName.toLowerCase().replace(/\s+/g, '-') : '#'
  const playerImage = `https://api.sofascore.app/api/v1/player/${player.id}/image`
  const teamImage = player.team?.id ? `https://api.sofascore.app/api/v1/team/${player.team.id}/image` : null
  const transferHistory = transfers?.transfers || []

  // 3. Schema Markup (Person)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    givenName: player.firstName,
    familyName: player.lastName,
    birthDate: player.dateOfBirthTimestamp ? new Date(player.dateOfBirthTimestamp * 1000).toISOString().split('T')[0] : undefined,
    nationality: player.nationality?.name,
    height: player.height,
    image: playerImage,
    url: `https://kickaiofmatches.com/players/${id}`,
    jobTitle: 'Professional Football Player',
    athlete: {
      '@type': 'Athlete',
      team: player.team ? {
        '@type': 'SportsTeam',
        name: player.team.name,
        logo: teamImage
      } : undefined,
      position: player.position
    }
  }

  return (
    <main className="min-h-screen bg-black-900 text-gray-100 pb-20">
      <Script id="player-schema" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Hero Profile */}
      <div className="relative bg-gradient-to-b from-black-800 to-black-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-8">
          {/* Player Image */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gold-500 overflow-hidden shadow-2xl bg-black-700">
              <img src={playerImage} alt={player.name} className="w-full h-full object-cover" />
            </div>
            {teamImage && (
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg w-12 h-12 flex items-center justify-center">
                <img src={teamImage} alt={teamName} className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black text-white mb-2">{player.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                🌍 {player.nationality?.name}
              </span>
              {player.position && (
                <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-white font-mono">
                  {player.position}
                </span>
              )}
              {player.shirtNumber && (
                <span>#{player.shirtNumber}</span>
              )}
              {player.height && (
                <span>📏 {player.height}cm</span>
              )}
              {player.preferredFoot && (
                <span>👟 {player.preferredFoot}</span>
              )}
            </div>

            {player.team && (
              <div className="mt-4">
                Current Team: {' '}
                <Link href={`/teams/${teamSlug}`} className="text-gold-400 hover:text-gold-300 font-bold hover:underline">
                  {player.team.name}
                </Link>
              </div>
            )}
          </div>

          {/* Contract / Value (if avail) */}
          <div className="text-center md:text-right">
            {player.proposedMarketValue && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Market Value</div>
                <div className="text-2xl font-bold text-green-400">€{(player.proposedMarketValue / 1000000).toFixed(1)}M</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-3">

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">

          {/* Transfer History Table */}
          <section className="bg-black-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Transfer History</h2>
              <span className="text-xs text-gray-400">Live Data</span>
            </div>
            {transferHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-400 bg-black-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">From</th>
                      <th className="p-3">To</th>
                      <th className="p-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferHistory.map((t: any, i: number) => (
                      <tr key={i} className="border-t border-gray-700/30 hover:bg-white/5">
                        <td className="p-3 text-gray-300">{new Date(t.transferDateTimestamp * 1000).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{t.transferFrom?.name}</td>
                        <td className="p-3 font-medium text-white">{t.transferTo?.name}</td>
                        <td className="p-3 text-right text-green-400 font-mono">
                          {t.transferFeeDescription || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-gray-500 text-center italic">No transfer history available.</div>
            )}
          </section>

          {/* Bio / Extra Info (Mocked/Generic for now as API bio is rare) */}
          <section className="bg-black-800/50 rounded-xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-2">About {player.name}</h3>
            <p className="text-gray-300 leading-relaxed">
              {player.name} is a professional football player from {player.nationality?.name} who currently plays as a {player.position} for {player.team?.name}.
              Born on {new Date(player.dateOfBirthTimestamp * 1000).toLocaleDateString()}, they are currently {Math.floor((Date.now() - player.dateOfBirthTimestamp * 1000) / (31557600000))} years old.
            </p>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-black-800 rounded-xl p-5 border border-gray-700">
            <h3 className="font-bold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/teams" className="block p-2 rounded hover:bg-white/5 text-gray-300 hover:text-white transition">
                  ⚽ All Teams
                </Link>
              </li>
              <li>
                <Link href="/leagues" className="block p-2 rounded hover:bg-white/5 text-gray-300 hover:text-white transition">
                  🏆 Leagues & Cups
                </Link>
              </li>
              <li>
                <Link href="/live" className="block p-2 rounded hover:bg-white/5 text-red-400 hover:text-red-300 transition font-medium">
                  🔴 Live Scores
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </main>
  )
}
