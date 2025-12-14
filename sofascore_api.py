"""
SofaScore API Python Wrapper
Unofficial API client for SofaScore sports data.
No external dependencies - uses only built-in Python libraries.
"""

import urllib.request
import urllib.parse
import json
from typing import Optional, Dict, Any
from datetime import date


class SofaScoreAPI:
    """Python wrapper for SofaScore API endpoints."""
    
    BASE_URL = "https://api.sofascore.com/api/v1"
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
        }
    
    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to API."""
        url = f"{self.BASE_URL}{endpoint}"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    
    # ==================== SEARCH ====================
    
    def search(self, query: str) -> Dict[str, Any]:
        """Search for teams, players, tournaments."""
        return self._get("/search/all", params={"q": query})
    
    # ==================== EVENTS ====================
    
    def get_scheduled_events(self, sport: str = "football", event_date: Optional[date] = None) -> Dict[str, Any]:
        """Get scheduled events for a date."""
        if event_date is None:
            event_date = date.today()
        return self._get(f"/sport/{sport}/scheduled-events/{event_date.isoformat()}")
    
    def get_live_events(self, sport: str = "football") -> Dict[str, Any]:
        """Get all currently live events."""
        return self._get(f"/sport/{sport}/events/live")
    
    def get_event(self, event_id: int) -> Dict[str, Any]:
        """Get event details."""
        return self._get(f"/event/{event_id}")
    
    def get_event_lineups(self, event_id: int) -> Dict[str, Any]:
        """Get event lineups (starting XI, subs, formations)."""
        return self._get(f"/event/{event_id}/lineups")
    
    def get_event_incidents(self, event_id: int) -> Dict[str, Any]:
        """Get event incidents (goals, cards, subs)."""
        return self._get(f"/event/{event_id}/incidents")
    
    def get_event_statistics(self, event_id: int) -> Dict[str, Any]:
        """Get event statistics by period."""
        return self._get(f"/event/{event_id}/statistics")
    
    def get_event_h2h(self, event_id: int) -> Dict[str, Any]:
        """Get head-to-head record for an event."""
        return self._get(f"/event/{event_id}/h2h")
    
    # ==================== TEAMS ====================
    
    def get_team(self, team_id: int) -> Dict[str, Any]:
        """Get team details."""
        return self._get(f"/team/{team_id}")
    
    def get_team_players(self, team_id: int) -> Dict[str, Any]:
        """Get team squad/players."""
        return self._get(f"/team/{team_id}/players")
    
    def get_team_events_last(self, team_id: int, page: int = 0) -> Dict[str, Any]:
        """Get team's past events (paginated)."""
        return self._get(f"/team/{team_id}/events/last/{page}")
    
    def get_team_events_next(self, team_id: int, page: int = 0) -> Dict[str, Any]:
        """Get team's upcoming events (paginated)."""
        return self._get(f"/team/{team_id}/events/next/{page}")
    
    def get_team_transfers(self, team_id: int) -> Dict[str, Any]:
        """Get team transfers (in and out)."""
        return self._get(f"/team/{team_id}/transfers")
    
    # ==================== PLAYERS ====================
    
    def get_player(self, player_id: int) -> Dict[str, Any]:
        """Get player details."""
        return self._get(f"/player/{player_id}")
    
    def get_player_seasons(self, player_id: int) -> Dict[str, Any]:
        """Get player's statistics seasons."""
        return self._get(f"/player/{player_id}/statistics/seasons")
    
    def get_player_transfers(self, player_id: int) -> Dict[str, Any]:
        """Get player's transfer history."""
        return self._get(f"/player/{player_id}/transfer-history")
    
    # ==================== TOURNAMENTS ====================
    
    def get_tournament_seasons(self, tournament_id: int) -> Dict[str, Any]:
        """Get all seasons for a tournament."""
        return self._get(f"/unique-tournament/{tournament_id}/seasons")
    
    def get_standings(self, tournament_id: int, season_id: int) -> Dict[str, Any]:
        """Get league standings/table."""
        return self._get(f"/unique-tournament/{tournament_id}/season/{season_id}/standings/total")


# ==================== COMMON IDs ====================

class IDs:
    """Common SofaScore IDs for quick reference."""
    
    # Tournaments
    PREMIER_LEAGUE = 17
    LA_LIGA = 8
    BUNDESLIGA = 35
    SERIE_A = 23
    LIGUE_1 = 34
    CHAMPIONS_LEAGUE = 7
    
    # Teams
    ARSENAL = 42
    LIVERPOOL = 44
    MANCHESTER_CITY = 17
    CHELSEA = 38
    REAL_MADRID = 2829
    BARCELONA = 2817
    
    # Players
    BUKAYO_SAKA = 934235
    ERLING_HAALAND = 839956
    LIONEL_MESSI = 12994


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    api = SofaScoreAPI()
    
    print("=== Search: Arsenal ===")
    results = api.search("arsenal")
    for r in results.get("results", [])[:3]:
        e = r.get("entity", {})
        print(f"  {e.get('name')} (ID: {e.get('id')}, Type: {r.get('type')})")
    
    print("\n=== Arsenal Team Info ===")
    team = api.get_team(IDs.ARSENAL).get("team", {})
    print(f"  Name: {team.get('name')}")
    print(f"  Manager: {team.get('manager', {}).get('name')}")
    print(f"  Venue: {team.get('venue', {}).get('name')}")
    
    print("\n=== Live Football Events ===")
    live = api.get_live_events()
    events = live.get("events", [])[:5]
    if events:
        for event in events:
            home = event.get("homeTeam", {}).get("name")
            away = event.get("awayTeam", {}).get("name")
            hs = event.get("homeScore", {}).get("current", 0)
            aws = event.get("awayScore", {}).get("current", 0)
            print(f"  {home} {hs} - {aws} {away}")
    else:
        print("  No live events right now")
    
    print("\n=== Premier League Standings (Top 5) ===")
    standings = api.get_standings(IDs.PREMIER_LEAGUE, 61627)
    for row in standings.get("standings", [{}])[0].get("rows", [])[:5]:
        name = row.get("team", {}).get("name")
        print(f"  {row.get('position')}. {name} - {row.get('points')} pts")
