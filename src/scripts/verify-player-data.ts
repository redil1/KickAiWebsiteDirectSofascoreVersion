
import { sofascoreService } from '../services/sofascore'

// Force legacy mode for this test
process.env.SOFASCORE_API_TYPE = 'legacy'
process.env.SOFASCORE_API_URL = 'http://155.117.46.251:8004/api/v1'

async function verify() {
    console.log('🧪 Testing Legacy API Player Data...')
    console.log(`Target: ${process.env.SOFASCORE_API_URL}`)

    // Messi ID: 12994
    const playerId = '12994'

    try {
        console.log(`\n1. Fetching Player Profile (${playerId})...`)
        const profile = await sofascoreService.getPlayer(playerId)
        console.log('RAW PROFILE:', JSON.stringify(profile, null, 2))

        if (profile) {
            console.log('✅ Profile Success!')
            console.log('Name:', profile.name)
            console.log('Team:', profile.team?.name)
            console.log('Nationality:', profile.nationality?.name)
        } else {
            console.error('❌ Profile Failed (Returned null)')
        }

        console.log(`\n2. Fetching Transfers (${playerId})...`)
        const transfers = await sofascoreService.getPlayerTransfers(playerId)
        console.log('RAW TRANSFERS:', JSON.stringify(transfers, null, 2))

        if (transfers) {
            console.log('✅ Transfers Success!')
            console.log('Count:', transfers.transfers?.length)
            if (transfers.transfers?.length > 0) {
                const t = transfers.transfers[0]
                console.log(`Latest: ${t.fromTeam?.name} -> ${t.toTeam?.name}`)
            }
        } else {
            console.warn('⚠️ Transfers Failed or Empty (Returned null)')
        }

    } catch (error) {
        console.error('🚨 Fatal Error:', error)
    }
}

verify()
