/**
 * IndexNow Integration for Instant Search Engine Indexation
 * 
 * IndexNow is an initiative by Microsoft Bing, Yandex, and other search engines
 * that allows websites to instantly notify search engines about content changes.
 * 
 * This dramatically reduces the time from content creation to indexation
 * from days/weeks to minutes.
 */

const INDEXNOW_ENDPOINTS = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
]

// Generate a unique key for IndexNow verification
// This key should be placed in a file at /{key}.txt on your domain
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'kickai-indexnow-key-2025'

interface IndexNowResult {
    endpoint: string
    success: boolean
    status?: number
    error?: string
}

/**
 * Notify search engines about new or updated URLs via IndexNow
 * @param urls - Array of full URLs to submit (max 10,000 per request)
 * @returns Results from each endpoint
 */
export async function notifyIndexNow(urls: string | string[]): Promise<IndexNowResult[]> {
    const urlList = Array.isArray(urls) ? urls : [urls]

    if (urlList.length === 0) {
        console.log('IndexNow: No URLs to submit')
        return []
    }

    // Extract host from first URL
    const firstUrl = new URL(urlList[0])
    const host = firstUrl.host

    console.log(`🔔 IndexNow: Submitting ${urlList.length} URL(s) to search engines...`)

    const payload = {
        host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urlList.slice(0, 10000), // Max 10,000 URLs per request
    }

    const results: IndexNowResult[] = []

    // Submit to all IndexNow endpoints in parallel
    const submissions = INDEXNOW_ENDPOINTS.map(async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(payload),
            })

            const result: IndexNowResult = {
                endpoint,
                success: response.ok || response.status === 202,
                status: response.status,
            }

            if (response.ok || response.status === 202) {
                console.log(`✅ IndexNow: ${endpoint} accepted (${response.status})`)
            } else {
                result.error = await response.text().catch(() => 'Unknown error')
                console.warn(`⚠️ IndexNow: ${endpoint} returned ${response.status}`)
            }

            return result
        } catch (error) {
            const result: IndexNowResult = {
                endpoint,
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            }
            console.error(`❌ IndexNow: ${endpoint} failed:`, error)
            return result
        }
    })

    const allResults = await Promise.all(submissions)
    results.push(...allResults)

    const successCount = results.filter(r => r.success).length
    console.log(`🔔 IndexNow: ${successCount}/${INDEXNOW_ENDPOINTS.length} endpoints accepted`)

    return results
}

/**
 * Notify IndexNow about a single URL change
 * Convenience wrapper for single URL submissions
 */
export async function notifyUrlChange(url: string): Promise<boolean> {
    const results = await notifyIndexNow(url)
    return results.some(r => r.success)
}

/**
 * Build URLs for common page types
 */
export function buildMatchUrl(slug: string, baseUrl: string = 'https://live.iptv.shopping'): string {
    return `${baseUrl}/watch/${slug}`
}

export function buildLeagueUrl(slug: string, baseUrl: string = 'https://live.iptv.shopping'): string {
    return `${baseUrl}/leagues/${slug}`
}

export function buildTeamUrl(slug: string, baseUrl: string = 'https://live.iptv.shopping'): string {
    return `${baseUrl}/teams/${slug}`
}

export function buildPlayerUrl(id: string, baseUrl: string = 'https://live.iptv.shopping'): string {
    return `${baseUrl}/players/${id}`
}
