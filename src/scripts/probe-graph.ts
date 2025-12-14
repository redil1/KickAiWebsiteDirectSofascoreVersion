
import { sofascoreService } from '../services/sofascore'

// Force legacy mode for this test
process.env.SOFASCORE_API_TYPE = 'legacy'
process.env.SOFASCORE_API_URL = 'http://155.117.46.251:8004/api/v1'

async function verifyGraph() {
    console.log('🧪 Probing Momentum Graph Endpoint...')

    // Use a known live or recent match ID. 
    // Since I don't have a dynamic one, I'll try a few or just a hardcoded one if I knew one.
    // I'll try to fetch a list of live events first to get a valid ID.

    try {
        console.log('Fetching live events to find a candidate...')
        // We know getScheduledEvents works
        const live = await sofascoreService.getScheduledEvents('2024-12-14') // or '2025-05-20' etc. using today's date would be better but I'll try a recent valid date from previous context or just fetch "live" if possible.
        // Actually, let's just use a hardcoded random ID if we can't search. 
        // Or better, use the ID from the previous player transfer (Barcelona match maybe? no that was a transfer).

        // I will try to fetch categories and picking one, then events.
        // Or just probe a known ID structure.

        // Let's rely on finding *any* event.
        // I'll try to lists events for "today".
        const today = new Date().toISOString().split('T')[0]
        const events = await sofascoreService.getScheduledEvents(today)
        const match = events?.events?.[0]

        if (!match) {
            console.error('❌ No events found today to test with.')
            return
        }

        const matchId = match.id
        console.log(`Candidate Match: ${match.homeTeam?.name} vs ${match.awayTeam?.name} (ID: ${matchId})`)

        // Probe Graph Endpoint
        // Standard is /event/{id}/graph
        console.log(`\nProbing /event/${matchId}/graph ...`)
        // Cast to any to access private 'get' method for probing
        const graph = await (sofascoreService as any).get(`/event/${matchId}/graph`)

        if (graph) {
            console.log('✅ Graph Data Found!')
            const points = (graph as any).graphPoints
            console.log('Points:', points?.length || '0')
            console.log('Sample:', JSON.stringify(points?.[0] || {}))
        } else {
            console.error('❌ Graph Endpoint returned null/404.')

            // Try legacy specific path if standard fails?
            console.log('Probing /football/match/graph ...')
            const graphLegacy = await (sofascoreService as any).get(`/football/match/graph?id=${matchId}`)
            if (graphLegacy) {
                console.log('✅ Legacy Graph Found!')
            } else {
                console.error('❌ Legacy Graph also failed.')
            }
        }

    } catch (error) {
        console.error('🚨 Error:', error)
    }
}

verifyGraph()
