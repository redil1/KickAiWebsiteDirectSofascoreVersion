
import { sofascoreService } from '../services/sofascore.js'

async function testSofascoreIntegration() {
    console.log('🚀 Starting Sofascore API Full Integration Test...\n')

    // 1. Search for Arsenal
    console.log('🔎 1. Testing Search (Query: "Arsenal")...')
    const searchResults = await sofascoreService.search('Arsenal')
    if (searchResults?.results?.length > 0) {
        const firstResult = searchResults.results[0].entity
        console.log(`   ✅ Found: ${firstResult.name} (ID: ${firstResult.id})`)
    } else {
        console.log('   ❌ Search failed or no results')
    }
    console.log('')

    // 2. Get Team Details (Arsenal - ID 42)
    console.log('🏟️  2. Testing Get Team (ID: 42 - Arsenal)...')
    const teamData = await sofascoreService.getTeam('42')
    if (teamData?.team) {
        console.log(`   ✅ Team: ${teamData.team.name}`)
        console.log(`   ✅ Stadium: ${teamData.team.venue?.name}`)
    } else {
        console.log('   ❌ Failed to fetch team data')
    }
    console.log('')

    // 3. Get Premier League Table (PL ID: 17, Season 24/25 ID: 61627)
    // Note: Season ID might change, using the one from reference or finding a way to get it
    console.log('🏆 3. Testing Standings (Premier League)...')
    const standings = await sofascoreService.getStandings('17', '61627')
    if (standings?.standings?.[0]?.rows?.length > 0) {
        const topTeam = standings.standings[0].rows[0]
        console.log(`   ✅ Top Team: ${topTeam.team.name} (${topTeam.points} pts)`)
    } else {
        console.log('   ❌ Failed to fetch standings (Season ID might be old)')
    }
    console.log('')

    // 4. Test Live/Event Data (Using a known ID or recent one if possible)
    // For this test we'll try a static ID from the reference, knowing it might be old, 
    // just to check structure, or we can't really test live without a live ID.
    // Let's try to fetch player info instead which is stable.

    console.log('👤 4. Testing Player Details (Saka - ID 934235)...')
    const player = await sofascoreService.getPlayer('934235')
    if (player?.player) {
        console.log(`   ✅ Player: ${player.player.name}`)
        console.log(`   ✅ Position: ${player.player.position}`)
    } else {
        console.log('   ❌ Failed to fetch player data')
    }

}

testSofascoreIntegration().catch(console.error)
