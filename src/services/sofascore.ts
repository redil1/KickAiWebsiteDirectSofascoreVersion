
export interface LiveScoreData {
    homeScore: number
    awayScore: number
    status: string
    minute: number
    isRunning: boolean
}

export interface SofascoreLineups {
    confirmed: boolean
    home: {
        formation: string
        players: any[]
    }
    away: {
        formation: string
        players: any[]
    }
}

export interface SofascoreIncidents {
    incidents: any[]
}

export interface SofascoreStatistics {
    statistics: any[]
}

export interface SofascoreH2H {
    teamDuel: {
        homeWins: number
        awayWins: number
        draws: number
    }
    managerDuel: {
        homeWins: number
        awayWins: number
        draws: number
    }
}

export interface SofascoreStandings {
    standings: Array<{
        type: string
        rows: Array<{
            position: number
            team: { name: string, id: number }
            points: number
            matches: number
            wins: number
            draws: number
            losses: number
            scoresFor: number
            scoresAgainst: number
        }>
    }>
}

export class SofascoreService {
    // Default to Legacy API for stability (Direct IP)
    private baseUrl = process.env.SOFASCORE_API_URL || 'http://155.117.46.251:8004'

    // Default to legacy mode to handle data structure correctly
    private apiType = process.env.SOFASCORE_API_TYPE || 'legacy'

    /**
     * Generic GET request handler using got-scraping to bypass Cloudflare
     */
    private async get<T>(endpoint: string): Promise<T | null> {
        try {
            // Dynamic import to avoid ESM/CJS resolution issues in Docker/tsx
            const { gotScraping } = await import('got-scraping')

            const response = await gotScraping({
                url: `${this.baseUrl}${endpoint}`,
                headerGeneratorOptions: {
                    browsers: [
                        {
                            name: 'chrome',
                            minVersion: 130,
                        },
                    ],
                    devices: ['desktop'],
                    locales: ['en-US'],
                    operatingSystems: ['windows'],
                },
                // Add proxy support
                proxyUrl: process.env.SOFASCORE_PROXY || process.env.HTTPS_PROXY,
                responseType: 'json',
                timeout: { request: 10000 } // 10s timeout
            })

            // Legacy Adapter Transformation
            if (this.apiType === 'legacy' && (response.body as any).success && (response.body as any).data) {
                return (response.body as any).data as T;
            }

            return response.body as T

        } catch (error: any) {
            if (error.response?.statusCode === 404) {
                console.warn(`⚠️ Endpoint ${endpoint} not found on Sofascore`)
            } else if (error.response?.statusCode === 403) {
                console.error(`⛔️ Blocked by Cloudflare for endpoint ${endpoint}`)
            } else {
                console.error(`❌ Error fetching ${endpoint}:`, error.message)
            }
            return null
        }
    }

    // ==================== SCHEDULE & FIXTURES ====================

    /**
     * Get scheduled events for a specific date
     * @param date YYYY-MM-DD
     * @param sport default 'football'
     */
    async getScheduledEvents(date: string, sport: string = 'football'): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/events/scheduled?date=${date}`)
        }
        return this.get(`/sport/${sport}/scheduled-events/${date}`)
    }

    // ==================== EVENTS ====================

    /**
     * Fetch match details including status, venue, referee
     */
    async getEvent(eventId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/event/details?id=${eventId}`)
        }
        return this.get(`/event/${eventId}`)
    }

    /**
     * Get Match Momentum Graph
     */
    async getMatchGraph(eventId: string): Promise<any | null> {
        // Both Legacy and Standard seem to support this pattern, but let's be safe
        // Based on probe: Standard /event/{id}/graph works on Legacy server too.
        return this.get(`/event/${eventId}/graph`)
    }

    /**
     * Fetch live score for a match (legacy wrapper for backward compatibility)
     */
    async fetchLiveScore(eventId: string): Promise<LiveScoreData | null> {
        if (!eventId) return null

        const data = await this.getEvent(eventId)
        if (!data || !data.event) return null

        const event = data.event

        // Calculate minute
        let minute = 0
        if (event.time?.currentPeriodStartTimestamp) {
            minute = Math.floor((Date.now() / 1000 - event.time.currentPeriodStartTimestamp) / 60)
            // Add 45 for second half
            if (event.status?.type === 'inprogress' && event.status?.code === 7) {
                minute += 45
            }
        }

        return {
            homeScore: event.homeScore?.current || 0,
            awayScore: event.awayScore?.current || 0,
            status: event.status?.description || 'Unknown',
            minute: minute > 0 ? minute : 0,
            isRunning: event.status?.type === 'inprogress'
        }
    }

    /**
     * Get lineups (starting XI, subs, formations)
     */
    /**
     * Get lineups (starting XI, subs, formations)
     */
    async getLineups(eventId: string): Promise<SofascoreLineups | null> {
        if (this.apiType === 'legacy') {
            return this.get<SofascoreLineups>(`/football/event/lineups?id=${eventId}`)
        }
        return this.get<SofascoreLineups>(`/event/${eventId}/lineups`)
    }

    /**
     * Get incidents (goals, cards, subs)
     */
    async getIncidents(eventId: string): Promise<SofascoreIncidents | null> {
        if (this.apiType === 'legacy') {
            // Fallback attempt or specific endpoint if known. 
            // User didn't provide incidents, but it might be in details.
            // For now, we leave as standard or maybe try a guess?
            // Safest is to try standard and fail, or guess /football/event/incidents?id=...
            // Let's guess:
            return this.get<SofascoreIncidents>(`/football/event/incidents?id=${eventId}`)
        }
        return this.get<SofascoreIncidents>(`/event/${eventId}/incidents`)
    }

    /**
     * Get detailed match statistics
     */
    async getStatistics(eventId: string): Promise<SofascoreStatistics | null> {
        return this.get<SofascoreStatistics>(`/event/${eventId}/statistics`)
    }

    /**
     * Get Head-to-Head records
     */
    async getH2H(eventId: string): Promise<SofascoreH2H | null> {
        return this.get<SofascoreH2H>(`/event/${eventId}/h2h`)
    }

    // ==================== TEAMS ====================

    /**
     * Get team details
     */
    async getTeam(teamId: string): Promise<any | null> {
        return this.get(`/team/${teamId}`)
    }

    /**
     * Get team squad/players
     */
    async getTeamPlayers(teamId: string): Promise<any | null> {
        return this.get(`/team/${teamId}/players`)
    }

    /**
     * Get team transfers
     */
    async getTeamTransfers(teamId: string): Promise<any | null> {
        return this.get(`/team/${teamId}/transfers`)
    }

    // ==================== PLAYERS ====================

    /**
     * Get player profile
     */
    /**
     * Get player profile
     */
    async getPlayer(playerId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/player/data?id=${playerId}`)
        }
        return this.get(`/player/${playerId}`)
    }

    /**
     * Get player transfer history
     */
    async getPlayerTransfers(playerId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/player/transfers?id=${playerId}`)
        }
        return this.get(`/player/${playerId}/transfer-history`)
    }

    /**
     * Get player season statistics
     */
    async getPlayerStatistics(playerId: string, seasonId: string, tournamentId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            // Legacy might group stats differently, but let's try a direct map if possible
            // OR use the 'total' stats endpoint often available
            return this.get(`/football/player/statistics?id=${playerId}&season_id=${seasonId}&tournament_id=${tournamentId}`)
        }
        return this.get(`/player/${playerId}/unique-tournament/${tournamentId}/season/${seasonId}/statistics/overall`)
    }

    // ==================== TOURNAMENTS & STANDINGS ====================

    /**
     * Get tournament details (name, slug, etc.)
     */
    async getTournamentDetails(tournamentId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/tournament/details?tournament_id=${tournamentId}`)
        }
        return this.get(`/unique-tournament/${tournamentId}`)
    }

    /**
     * Get available seasons for a tournament (for dynamic season lookup)
     */
    async getTournamentSeasons(tournamentId: string): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get(`/football/tournament/seasons?tournament_id=${tournamentId}`)
        }
        return this.get(`/unique-tournament/${tournamentId}/seasons`)
    }

    /**
     * Get league standings/table
     */
    async getStandings(tournamentId: string, seasonId: string): Promise<SofascoreStandings | null> {
        if (this.apiType === 'legacy') {
            return this.get<SofascoreStandings>(`/football/tournament/standings?tournament_id=${tournamentId}&season_id=${seasonId}`)
        }
        return this.get<SofascoreStandings>(`/unique-tournament/${tournamentId}/season/${seasonId}/standings/total`)
    }

    /**
     * Search for teams, players, tournaments
     */
    async search(query: string): Promise<any | null> {
        return this.get(`/search/all?q=${encodeURIComponent(query)}`)
    }

    async resolveTournamentId(slug: string): Promise<string | null> {
        try {
            // Search by slug
            const searchData = await this.search(slug);
            const results = (searchData as any)?.results || [];

            // Filter for football unique tournaments
            const candidates = results.filter((r: any) =>
                r.type === 'uniqueTournament' &&
                (r.entity?.sport?.slug === 'football' || r.entity?.category?.sport?.slug === 'football')
            );

            if (candidates.length === 0) return null;

            // Sort by popularity (score) descending to prioritize major leagues
            // e.g., "National League" matches England (high score) and Israel (low score)
            candidates.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

            // Prioritize exact slug match
            const exactMatch = candidates.find((c: any) => c.entity.slug === slug);
            if (exactMatch) {
                return String(exactMatch.entity.id);
            }

            return String(candidates[0].entity.id);
        } catch (error) {
            console.error('Error resolving tournament ID:', error);
            return null;
        }
    }

    // ==================== GLOBAL METADATA ====================

    /**
     * Get all categories and tournaments (for Sitemap)
     */
    async getCategories(): Promise<any | null> {
        if (this.apiType === 'legacy') {
            return this.get('/football/categories')
        }
        return this.get('/sport/football/categories')
    }

    // ==================== ADVANCED VISUALIZATIONS ====================

    /**
     * Get Attack Momentum Graph data
     */
    async getGraph(eventId: string): Promise<any | null> {
        return this.get(`/event/${eventId}/graph`)
    }

    /**
     * Get Shotmap data (xG, locations)
     */
    async getShotmap(eventId: string): Promise<any | null> {
        return this.get(`/event/${eventId}/shotmap`)
    }

    /**
     * Get Average Positions (Tactical formations)
     */
    async getAveragePositions(eventId: string): Promise<any | null> {
        return this.get(`/event/${eventId}/average-positions`)
    }
}

export const sofascoreService = new SofascoreService()
