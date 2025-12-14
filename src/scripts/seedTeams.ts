import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '../db/client'
import { sofascoreService } from '../services/sofascore'

const API_BASE = (process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004').replace(/\/$/, '')

// Major leagues to extract teams from
const MAJOR_LEAGUES = [
    { name: 'Premier League', tournamentId: '17' },
    { name: 'La Liga', tournamentId: '8' },
    { name: 'Bundesliga', tournamentId: '35' },
    { name: 'Serie A', tournamentId: '23' },
    { name: 'Ligue 1', tournamentId: '34' },
    { name: 'Champions League', tournamentId: '7' },
    { name: 'Eredivisie', tournamentId: '37' },
    { name: 'Championship', tournamentId: '18' },
    { name: 'Liga Portugal', tournamentId: '238' },
    { name: 'MLS', tournamentId: '242' },
]

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

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

export async function seedTeams() {
    console.log('⚽ Seeding teams data from standings...')

    const seenTeamIds = new Set<string>()
    let success = 0
    let failed = 0

    for (const league of MAJOR_LEAGUES) {
        try {
            console.log(`\n📊 Fetching teams from ${league.name}...`)

            // Fetch seasons to get current season ID
            const seasonsData = await fetchJson(`${API_BASE}/football/tournament/seasons?tournament_id=${league.tournamentId}`)
            await sleep(500)

            if (!seasonsData?.seasons?.length) {
                console.log(`  ⚠️ No seasons found for ${league.name}`)
                continue
            }

            // Current season is usually index 1 (index 0 is next season prep)
            const currentSeason = seasonsData.seasons[1] || seasonsData.seasons[0]
            const seasonId = currentSeason?.id

            if (!seasonId) {
                console.log(`  ⚠️ No current season ID for ${league.name}`)
                continue
            }

            // Fetch standings to extract teams
            const standingsData = await fetchJson(`${API_BASE}/football/tournament/standings?tournament_id=${league.tournamentId}&season_id=${seasonId}`)
            await sleep(500)

            const standings = standingsData?.standings || []
            if (!standings.length) {
                console.log(`  ⚠️ No standings found for ${league.name}`)
                continue
            }

            // Extract teams from standings
            const rows = standings[0]?.rows || []
            console.log(`  Found ${rows.length} teams in ${league.name}`)

            for (const row of rows) {
                const team = row.team
                if (!team?.id) continue

                const teamId = String(team.id)
                if (seenTeamIds.has(teamId)) continue
                seenTeamIds.add(teamId)

                try {
                    // Fetch detailed team info
                    const teamDetails = await fetchJson(`${API_BASE}/football/team/details?team_id=${teamId}`)
                    await sleep(300) // Rate limiting

                    const teamData = teamDetails?.team || team
                    const slug = slugify(teamData.name || team.name)
                    const name = teamData.name || team.name
                    const shortName = teamData.shortName || teamData.nameCode || null
                    const country = teamData.country?.name || null
                    const foundedYear = teamData.foundationDateTimestamp
                        ? new Date(teamData.foundationDateTimestamp * 1000).getFullYear()
                        : null
                    const venueId = teamData.venue?.id ? String(teamData.venue.id) : null
                    const managerId = teamData.manager?.id ? String(teamData.manager.id) : null
                    const primaryColor = teamData.teamColors?.primary || null
                    const secondaryColor = teamData.teamColors?.secondary || null

                    // Construct image URL
                    const imageUrl = sofascoreService.getTeamImage(teamId)

                    // Upsert team
                    await db.execute(sql`
            INSERT INTO teams (team_id, slug, name, short_name, country, founded_year, venue_id, manager_id, primary_color, secondary_color, image_url, updated_at)
            VALUES (${teamId}, ${slug}, ${name}, ${shortName}, ${country}, ${foundedYear}, ${venueId}, ${managerId}, ${primaryColor}, ${secondaryColor}, ${imageUrl}, NOW())
            ON CONFLICT (team_id) DO UPDATE SET
              slug = EXCLUDED.slug,
              name = EXCLUDED.name,
              short_name = EXCLUDED.short_name,
              country = EXCLUDED.country,
              founded_year = EXCLUDED.founded_year,
              venue_id = EXCLUDED.venue_id,
              manager_id = EXCLUDED.manager_id,
              primary_color = EXCLUDED.primary_color,
              secondary_color = EXCLUDED.secondary_color,
              image_url = EXCLUDED.image_url,
              updated_at = NOW()
          `)

                    // Also seed venue if available
                    if (teamData.venue?.id) {
                        const venue = teamData.venue
                        const venueSlug = slugify(venue.name || `venue-${venue.id}`)
                        const venueCity = venue.city?.name || null
                        const venueCountry = venue.country?.name || country

                        await db.execute(sql`
              INSERT INTO venues (venue_id, slug, name, city, country, capacity, surface, updated_at)
              VALUES (${String(venue.id)}, ${venueSlug}, ${venue.name}, ${venueCity}, ${venueCountry}, ${venue.capacity || null}, ${venue.surface || null}, NOW())
              ON CONFLICT (venue_id) DO UPDATE SET
                name = EXCLUDED.name,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                capacity = EXCLUDED.capacity,
                surface = EXCLUDED.surface,
                updated_at = NOW()
            `)
                        console.log(`    🏟️ Venue: ${venue.name}`)
                    }

                    // Also seed manager if available
                    if (teamData.manager?.id) {
                        const manager = teamData.manager
                        const managerSlug = slugify(manager.name || `manager-${manager.id}`)

                        await db.execute(sql`
              INSERT INTO managers (manager_id, slug, name, short_name, nationality, team_id, team_name, date_of_birth_ts, updated_at)
              VALUES (${String(manager.id)}, ${managerSlug}, ${manager.name}, ${manager.shortName || null}, ${manager.country?.name || null}, ${teamId}, ${name}, ${manager.dateOfBirthTimestamp || null}, NOW())
              ON CONFLICT (manager_id) DO UPDATE SET
                name = EXCLUDED.name,
                short_name = EXCLUDED.short_name,
                nationality = EXCLUDED.nationality,
                team_id = EXCLUDED.team_id,
                team_name = EXCLUDED.team_name,
                date_of_birth_ts = EXCLUDED.date_of_birth_ts,
                updated_at = NOW()
            `)
                        console.log(`    👨‍💼 Manager: ${manager.name}`)
                    }

                    success++
                    console.log(`  ✅ ${name} (${country})`)
                } catch (err) {
                    console.error(`  ❌ Failed to process team ${team.name}:`, err)
                    failed++
                }
            }
        } catch (err) {
            console.error(`❌ Error processing ${league.name}:`, err)
        }
    }

    console.log(`\n📊 Teams Seeding Complete:`)
    console.log(`  ✅ Success: ${success} teams`)
    console.log(`  ❌ Failed: ${failed} teams`)
    console.log(`  🏟️ Venues and 👨‍💼 Managers also seeded from team data`)
}

// Run if executed directly
if (require.main === module) {
    seedTeams()
        .then(() => {
            console.log('✅ Seeding complete!')
            process.exit(0)
        })
        .catch((err) => {
            console.error('❌ Seeding failed:', err)
            process.exit(1)
        })
}
