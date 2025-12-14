
import { sofascoreService } from '../services/sofascore.js'

async function testFixtures() {
    console.log('🚀 Testing Direct Sofascore Scheduled Events...\n')

    const today = new Date().toISOString().slice(0, 10)
    console.log(`📅 Date: ${today}`)

    try {
        const data = await sofascoreService.getScheduledEvents(today)
        // Check if data has events array
        if (data && Array.isArray(data.events)) {
            console.log(`✅ Success! Found ${data.events.length} events.`)
            if (data.events.length > 0) {
                console.log(`   Sample: ${data.events[0].homeTeam.name} vs ${data.events[0].awayTeam.name}`)
            }
        } else {
            console.log('❌ Failed: Data format incorrect or empty', data)
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message)
    }
}

testFixtures().catch(console.error)
