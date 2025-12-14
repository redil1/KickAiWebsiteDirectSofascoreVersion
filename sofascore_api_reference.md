# SofaScore API Reference

**Base URL:** `https://api.sofascore.com/api/v1`

> [!NOTE]
> This documentation is reverse-engineered and unofficial. All endpoints return JSON.
> Most headers (like `User-Agent`) are standard, but some endpoints may require specific ones in the future.

---

## 1. Search

### 1.1. Search All
Search for teams, players, and tournaments by name.

- **Endpoint:** `/search/all`
- **Method:** `GET`
- **Parameters:**
  - `q` (required): The search query string (e.g., "arsenal").

**Example Request:**
`GET /search/all?q=arsenal`

**Response Structure:**
```json
{
  "results": [
    {
      "entity": {
        "id": 42,
        "name": "Arsenal",
        "slug": "arsenal",
        "type": "team",
        "sport": { "id": 1, "slug": "football", "name": "Football" }
      },
      "type": "team"
    }
  ]
}
```

---

## 2. Events (Matches)

### 2.1. Live Events
Get a list of all currently live matches for a specific sport.

- **Endpoint:** `/sport/{sportSlug}/events/live`
- **Method:** `GET`
- **Parameters:**
  - `sportSlug` (required): `football`, `basketball`, `tennis`, etc.

**Response Structure:**
```json
{
  "events": [
    {
      "id": 123456,
      "slug": "home-vs-away",
      "tournament": { "name": "Premier League", "uniqueTournament": { "id": 17 } },
      "homeTeam": { "name": "Arsenal", "id": 42 },
      "awayTeam": { "name": "Chelsea", "id": 38 },
      "status": { "code": 6, "description": "1st half", "type": "inprogress" },
      "homeScore": { "current": 1, "display": 1 },
      "awayScore": { "current": 0, "display": 0 }
    }
  ]
}
```

### 2.2. Scheduled Events
Get scheduled matches for a specific date.

- **Endpoint:** `/sport/{sportSlug}/scheduled-events/{date}`
- **Parameters:**
  - `sportSlug`: `football`, etc.
  - `date`: Format `YYYY-MM-DD`.

### 2.3. Event Details
Get general information about a specific match (status, score, venue, referee).

- **Endpoint:** `/event/{eventId}`
- **Method:** `GET`

**Response Structure:**
```json
{
  "event": {
    "id": 14025183,
    "tournament": { "name": "Premier League" },
    "homeTeam": { "name": "Arsenal", "id": 42 },
    "awayTeam": { "name": "Wolves", "id": 3 },
    "status": { "description": "Ended", "type": "finished" },
    "venue": { "name": "Emirates Stadium", "city": { "name": "London" } },
    "referee": { "name": "Jarred Gillett" }
  }
}
```

### 2.4. Lineups
Get the starting XI, substitutes, and formation for both teams.

- **Endpoint:** `/event/{eventId}/lineups`
- **Method:** `GET`

**Response Structure:**
```json
{
  "confirmed": true,
  "home": {
    "formation": "4-3-3",
    "players": [
      {
        "player": { "name": "David Raya", "id": 581310, "position": "G", "jerseyNumber": "1" },
        "substitute": false,
        "statistics": { "rating": 6.8, "minutesPlayed": 90 }
      }
    ]
  },
  "away": { "formation": "4-4-2", "players": [...] }
}
```

### 2.5. Incidents
Get chronological list of goals, cards, and substitutions.

- **Endpoint:** `/event/{eventId}/incidents`
- **Method:** `GET`

**Response Structure:**
```json
{
  "incidents": [
    {
      "time": 90,
      "incidentType": "card", // "goal", "substitution", "period"
      "incidentClass": "yellow",
      "player": { "name": "Player Name" }
    },
    {
      "time": 25,
      "incidentType": "goal",
      "homeScore": 1,
      "awayScore": 0,
      "player": { "name": "Kai Havertz" }
    }
  ]
}
```

### 2.6. Statistics
Get detailed match statistics (possession, shots, passes) grouped by period.

- **Endpoint:** `/event/{eventId}/statistics`
- **Method:** `GET`

**Response Structure:**
```json
{
  "statistics": [
    {
      "period": "ALL", // "1ST", "2ND"
      "groups": [
        {
          "groupName": "Match overview",
          "statisticsItems": [
            { "name": "Ball possession", "home": "55%", "away": "45%" },
            { "name": "Total shots", "home": "18", "away": "9" }
          ]
        }
      ]
    }
  ]
}
```

### 2.7. Head-to-Head (H2H)
Get the historical record between the two teams and managers.

- **Endpoint:** `/event/{eventId}/h2h`
- **Method:** `GET`

**Response Structure:**
```json
{
  "teamDuel": { "homeWins": 8, "awayWins": 2, "draws": 3 },
  "managerDuel": { "homeWins": 2, "awayWins": 0, "draws": 1 }
}
```

---

## 3. Teams

### 3.1. Team Details
Get basic team info.

- **Endpoint:** `/team/{teamId}`
- **Response:** Object containing `team` details (name, manager, venue, next/last match info).

### 3.2. Team Players (Squad)
Get the current squad list.

- **Endpoint:** `/team/{teamId}/players`
- **Response:** `players` array. Each item has `player` details and `marketValue`.

### 3.3. Team Matches (Past & Next)
- **Past:** `/team/{teamId}/events/last/{page}` (Page starts at 0)
- **Next:** `/team/{teamId}/events/next/{page}`

### 3.4. Team Transfers
Get incoming and outgoing transfers.

- **Endpoint:** `/team/{teamId}/transfers`
- **Response:** `transfersIn` and `transfersOut` arrays.
  
```json
{
  "transfersIn": [
    {
      "player": { "name": "Player Name" },
      "transferFrom": { "name": "Old Team" },
      "transferFee": 5000000,
      "type": 3 // 1=Loan, 3=Transfer
    }
  ]
}
```

---

## 4. Players

### 4.1. Player Details
Get player profile.

- **Endpoint:** `/player/{playerId}`
- **Method:** `GET`

### 4.2. Player Seasons
Get list of tournaments/seasons the player has data for.

- **Endpoint:** `/player/{playerId}/statistics/seasons`
- **Response:** `uniqueTournamentSeasons` array.

### 4.3. Transfer History
Get full career transfer history.

- **Endpoint:** `/player/{playerId}/transfer-history`
- **Response:** `transferHistory` array (similar structure to team transfers).

---

## 5. Tournaments & Standings

### 5.1. Tournament Seasons
Get all seasons in history for a tournament.

- **Endpoint:** `/unique-tournament/{uniqueTournamentId}/seasons`
- **Response:** `seasons` array with `id` and `year`.

### 5.2. Standings (League Table)
Get the league table.

- **Endpoint:** `/unique-tournament/{uniqueTournamentId}/season/{seasonId}/standings/total`
- **Method:** `GET`
- **Parameters:**
  - `uniqueTournamentId`: e.g., 17 (Premier League)
  - `seasonId`: e.g., 61627 (24/25 Season)

**Response Structure:**
```json
{
  "standings": [
    {
      "type": "total",
      "rows": [
        {
          "position": 1,
          "team": { "name": "Arsenal", "id": 42 },
          "matches": 10,
          "wins": 8,
          "draws": 1,
          "losses": 1,
          "points": 25,
          "scoresFor": 22,
          "scoresAgainst": 8
        }
      ]
    }
  ]
}
```

---

## Common IDs Reference

| Name | ID | Type |
|------|----|------|
| **Football** | 1 | Sport |
| **Premier League** | 17 | Tournament |
| **La Liga** | 8 | Tournament |
| **Champions League** | 7 | Tournament |
| **Arsenal** | 42 | Team |
| **Man City** | 17 | Team |
| **Liverpool** | 44 | Team |
| **Real Madrid** | 2829 | Team |
| **Barcelona** | 2817 | Team |
