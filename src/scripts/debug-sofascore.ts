
import { sofascoreService } from '../services/sofascore';

async function main() {
    console.log('--- DEBUG START ---');
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Fetching events for date: ${today}`);

        // We can't access private methods directly, but we can try to call the public one and log what we get.
        // Or we can construct the request manually to see the raw response using same logic.

        const response = await sofascoreService.getScheduledEvents(today);
        console.log('Response type:', typeof response);
        console.log('Full Response:', JSON.stringify(response, null, 2));

        let events = [];
        if (response && response.events) {
            events = response.events;
        }

        console.log('Events array length:', events.length);
        if (events.length > 0) {
            console.log('First event sample:', JSON.stringify(events[0], null, 2));
        } else {
            console.log('Events array is empty.');
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
    console.log('--- DEBUG END ---');
}

main();
