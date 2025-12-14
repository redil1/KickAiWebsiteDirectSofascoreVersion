import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '../db/client'

const API_BASE = (process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004').replace(/\/$/, '')

// Major leagues to cache - these are always kept fresh
const MAJOR_LEAGUES = [
    { name: 'Premier League', slug: 'premier-league', tournamentId: '17' },
    { name: 'La Liga', slug: 'la-liga', tournamentId: '8' },
    { name: 'Bundesliga', slug: 'bundesliga', tournamentId: '35' },
    { name: 'Serie A', slug: 'serie-a', tournamentId: '23' },
    { name: 'Ligue 1', slug: 'ligue-1', tournamentId: '34' },
    { name: 'Champions League', slug: 'champions-league', tournamentId: '7' },
    { name: 'Europa League', slug: 'europa-league', tournamentId: '679' },
    { name: 'Eredivisie', slug: 'eredivisie', tournamentId: '37' },
    { name: 'Championship', slug: 'championship', tournamentId: '18' },
    { name: 'Liga Portugal', slug: 'primeira-liga', tournamentId: '238' },
    { name: 'Conference League', slug: 'conference-league', tournamentId: '17015' },
    { name: 'MLS', slug: 'mls', tournamentId: '242' },
]

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function fetchJson(url: string): Promise<any> {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 30_000)
    try {
        const res = await fetch(url, { signal: ctrl.signal, headers: { 'accept': 'application/json' } })
        const data = await res.json().catch(() => ({}))
        // Handle legacy API wrapper
        if (data.success && data.data) return data.data
        return data
    } catch (e) {
        console.error(`Fetch error for ${url}:`, e)
        return null
    } finally {
        clearTimeout(to)
    }
}

export async function seedTournaments() {
    console.log('🏆 Seeding tournament data...')

    let success = 0
    let failed = 0

    for (const league of MAJOR_LEAGUES) {
        try {
            console.log(`  📊 Fetching ${league.name} (ID: ${league.tournamentId})...`)

            // Fetch tournament details
            const details = await fetchJson(`${API_BASE}/football/tournament/details?tournament_id=${league.tournamentId}`)
            await sleep(1000) // Rate limiting

            // Fetch seasons
            const seasonsData = await fetchJson(`${API_BASE}/football/tournament/seasons?tournament_id=${league.tournamentId}`)
            await sleep(1000)

            const seasons = seasonsData?.seasons || []
            // Current season is usually index 1 (index 0 is next season)
            const currentSeason = seasons[1] || seasons[0]
            const currentSeasonId = currentSeason?.id ? String(currentSeason.id) : null

            // Fetch standings if we have a season
            let standings = null
            if (currentSeasonId) {
                const standingsData = await fetchJson(`${API_BASE}/football/tournament/standings?tournament_id=${league.tournamentId}&season_id=${currentSeasonId}`)
                standings = standingsData?.standings || null
                await sleep(1000)
            }

            // Extract tournament info
            const tournamentInfo = details?.uniqueTournament || {}
            const name = tournamentInfo.name || league.name
            const country = tournamentInfo.category?.name || null
            const logoUrl = `https://api.sofascore.app/api/v1/unique-tournament/${league.tournamentId}/image`

            // Upsert tournament
            await db.execute(sql`
        INSERT INTO tournaments (tournament_id, slug, name, country, logo_url, current_season_id, seasons, updated_at)
        VALUES (${league.tournamentId}, ${league.slug}, ${name}, ${country}, ${logoUrl}, ${currentSeasonId}, ${JSON.stringify(seasons)}, NOW())
        ON CONFLICT (tournament_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          country = EXCLUDED.country,
          logo_url = EXCLUDED.logo_url,
          current_season_id = EXCLUDED.current_season_id,
          seasons = EXCLUDED.seasons,
          updated_at = NOW()
      `)

            // Upsert standings if available
            if (standings && currentSeasonId) {
                await db.execute(sql`
          INSERT INTO tournament_standings (tournament_id, season_id, standings, updated_at)
          VALUES (${league.tournamentId}, ${currentSeasonId}, ${JSON.stringify(standings)}, NOW())
          ON CONFLICT (tournament_id, season_id) DO UPDATE SET
            standings = EXCLUDED.standings,
            updated_at = NOW()
        `)
            }

            console.log(`    ✅ ${name}: ${seasons.length} seasons, standings: ${standings ? 'yes' : 'no'}`)
            success++

        } catch (err) {
            console.error(`    ❌ Failed to seed ${league.name}:`, err)
            failed++
        }
    }

    console.log(`\n🏁 Tournament seeding complete: ${success} success, ${failed} failed`)
}

// Execute if run directly
import { fileURLToPath } from 'url'
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedTournaments()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ seedTournaments failed:', err)
            process.exit(1)
        })
}
