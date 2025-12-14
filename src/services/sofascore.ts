
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
    private baseUrl = 'https://api.sofascore.com/api/v1'

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
                            minVersion: 120,
                        },
                    ],
                    devices: ['desktop'],
                    locales: ['en-US'],
                    operatingSystems: ['macos'],
                },
                responseType: 'json',
                timeout: { request: 10000 } // 10s timeout
            })

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
        return this.get(`/sport/${sport}/scheduled-events/${date}`)
    }

    // ==================== EVENTS ====================

    /**
     * Fetch match details including status, venue, referee
     */
    async getEvent(eventId: string): Promise<any | null> {
        return this.get(`/event/${eventId}`)
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
    async getLineups(eventId: string): Promise<SofascoreLineups | null> {
        return this.get<SofascoreLineups>(`/event/${eventId}/lineups`)
    }

    /**
     * Get incidents (goals, cards, subs)
     */
    async getIncidents(eventId: string): Promise<SofascoreIncidents | null> {
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
    async getPlayer(playerId: string): Promise<any | null> {
        return this.get(`/player/${playerId}`)
    }

    /**
     * Get player transfer history
     */
    async getPlayerTransfers(playerId: string): Promise<any | null> {
        return this.get(`/player/${playerId}/transfer-history`)
    }

    // ==================== TOURNAMENTS & STANDINGS ====================

    /**
     * Get league standings/table
     */
    async getStandings(tournamentId: string, seasonId: string): Promise<SofascoreStandings | null> {
        return this.get<SofascoreStandings>(`/unique-tournament/${tournamentId}/season/${seasonId}/standings/total`)
    }

    /**
     * Search for teams, players, tournaments
     */
    async search(query: string): Promise<any | null> {
        return this.get(`/search/all?q=${encodeURIComponent(query)}`)
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
