#!/usr/bin/env python3
"""
FastAPI server for SofaScore API functions
"""

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import sofascore
import uvicorn
import os
from datetime import datetime
import traceback

# Create FastAPI app
app = FastAPI(
    title="SofaScore API Server",
    description="Local API server for SofaScore data fetching functions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to handle API responses
def handle_api_call(func, *args, **kwargs):
    """Helper function to handle API calls and return consistent responses"""
    try:
        result = func(*args, **kwargs)
        if result is not None:
            return {"success": True, "data": result}
        else:
            return {"success": False, "error": "API call returned None (possible API error or invalid parameters)"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "SofaScore API Server",
        "version": "1.0.0",
        "available_endpoints": {
            "football_categories": "/football/categories",
            "scheduled_events": "/football/events/scheduled",
            "player_heatmap": "/football/player/heatmap",
            "event_details": "/football/event/details",
            "lineups": "/football/event/lineups",
            "newly_added_events": "/football/events/new",
            "player_image": "/images/player",
            "team_image": "/images/team",
            "tournaments": "/football/tournaments",
            "standings": "/football/tournament/standings"
        },
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Football data endpoints
@app.get("/football/categories")
async def get_football_categories():
    """Get football categories"""
    return handle_api_call(sofascore.get_football_categories)

@app.get("/football/events/scheduled")
async def get_scheduled_events(
    date: str = Query(..., description="Date in YYYY-MM-DD format", example="2025-05-25")
):
    """Get scheduled football events for a specific date"""
    try:
        # Validate date format
        datetime.strptime(date, "%Y-%m-%d")
        return handle_api_call(sofascore.get_scheduled_events, date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@app.get("/football/events/new")
async def get_newly_added_events():
    """Get newly added football events"""
    return handle_api_call(sofascore.get_newly_added_events)

@app.get("/football/player/heatmap")
async def get_player_heatmap(
    event_id: int = Query(..., description="Event ID"),
    player_id: int = Query(..., description="Player ID")
):
    """Get player heatmap data for a specific event"""
    return handle_api_call(sofascore.get_player_heatmap, event_id, player_id)

@app.get("/football/event/details")
async def get_event_details(
    event_id: int = Query(..., description="Event ID")
):
    """Get detailed information about a specific event"""
    return handle_api_call(sofascore.get_event_details, event_id)

@app.get("/football/event/lineups")
async def get_lineups(
    event_id: int = Query(..., description="Event ID")
):
    """Get lineups for a specific event"""
    return handle_api_call(sofascore.get_lineups, event_id)

@app.get("/football/tournaments")
async def get_football_tournaments():
    """Get football tournaments"""
    return handle_api_call(sofascore.get_football_tournaments)

@app.get("/football/tournament/standings")
async def get_tournament_standing(
    tournament_id: int = Query(..., description="Tournament ID"),
    season_id: int = Query(..., description="Season ID")
):
    """Get tournament standings"""
    return handle_api_call(sofascore.get_tournament_standing, tournament_id, season_id)

@app.get("/football/tournament/schedule")
async def get_tournament_schedule(
    tournament_id: int = Query(..., description="Tournament ID"),
    season_id: int = Query(..., description="Season ID")
):
    """Get tournament schedule"""
    return handle_api_call(sofascore.get_tournament_schedule, tournament_id, season_id)

@app.get("/football/tournament/featured")
async def get_tournament_featured_events(
    tournament_id: int = Query(..., description="Tournament ID")
):
    """Get featured events for a tournament"""
    return handle_api_call(sofascore.get_tournament_featured_events, tournament_id)

@app.get("/football/trending/players")
async def get_football_trending_players():
    """Get trending football players"""
    return handle_api_call(sofascore.get_football_trending_players)

@app.get("/football/suggestions")
async def get_football_suggestions():
    """Get football suggestions"""
    return handle_api_call(sofascore.get_football_suggestions)

@app.get("/football/live/categories")
async def get_football_live_categories():
    """Get live football categories"""
    return handle_api_call(sofascore.get_football_live_categories)

# Player and team data endpoints
@app.get("/football/player/statistics")
async def get_player_statistics(
    player_id: int = Query(..., description="Player ID"),
    tournament_id: int = Query(..., description="Tournament ID"),
    season_id: int = Query(..., description="Season ID")
):
    """Get player statistics"""
    return handle_api_call(sofascore.get_player_statistics, player_id, tournament_id, season_id)

@app.get("/football/player/transfer-history")
async def get_player_transfer_history(
    player_id: int = Query(..., description="Player ID")
):
    """Get player transfer history"""
    return handle_api_call(sofascore.get_player_transfer_history, player_id)

@app.get("/football/team/statistics")
async def get_team_statistics(
    team_id: int = Query(..., description="Team ID"),
    tournament_id: int = Query(..., description="Tournament ID"),
    season_id: int = Query(..., description="Season ID")
):
    """Get team statistics"""
    return handle_api_call(sofascore.get_team_statistics, team_id, tournament_id, season_id)

@app.get("/football/team/events")
async def get_team_events(
    team_id: int = Query(..., description="Team ID"),
    last: int = Query(5, description="Number of last events to fetch")
):
    """Get team events"""
    return handle_api_call(sofascore.get_team_events, team_id, last)

@app.get("/football/team-of-the-week")
async def get_team_of_the_week():
    """Get team of the week"""
    return handle_api_call(sofascore.get_team_of_the_week)

@app.get("/football/fan-ranking")
async def get_fan_ranking():
    """Get fan ranking"""
    return handle_api_call(sofascore.get_fan_ranking)

@app.get("/football/event-count")
async def get_event_count():
    """Get event count"""
    return handle_api_call(sofascore.get_event_count)

# Image download endpoints
@app.get("/images/player/download")
async def download_player_image(
    player_id: int = Query(..., description="Player ID")
):
    """Download player image"""
    try:
        image_path = sofascore.download_player_image(player_id)
        if image_path and os.path.exists(image_path):
            return FileResponse(
                path=image_path,
                media_type="image/png",
                filename=f"player_{player_id}.png"
            )
        else:
            raise HTTPException(status_code=404, detail="Player image not found or download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading player image: {str(e)}")

@app.get("/images/team/download/full")
async def download_team_image_full(
    team_id: int = Query(..., description="Team ID")
):
    """Download full team image"""
    try:
        image_path = sofascore.download_team_image_full(team_id)
        if image_path and os.path.exists(image_path):
            return FileResponse(
                path=image_path,
                media_type="image/png",
                filename=f"team_full_{team_id}.png"
            )
        else:
            raise HTTPException(status_code=404, detail="Team image not found or download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading team image: {str(e)}")

@app.get("/images/team/download/small")
async def download_team_image_small(
    team_id: int = Query(..., description="Team ID")
):
    """Download small team image"""
    try:
        image_path = sofascore.download_team_image_small(team_id)
        if image_path and os.path.exists(image_path):
            return FileResponse(
                path=image_path,
                media_type="image/png",
                filename=f"team_small_{team_id}.png"
            )
        else:
            raise HTTPException(status_code=404, detail="Team image not found or download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading team image: {str(e)}")

@app.get("/images/tournament/download")
async def download_tournament_image(
    tournament_id: int = Query(..., description="Tournament ID")
):
    """Download tournament image"""
    try:
        image_path = sofascore.download_tournament_image(tournament_id)
        if image_path and os.path.exists(image_path):
            return FileResponse(
                path=image_path,
                media_type="image/png",
                filename=f"tournament_{tournament_id}.png"
            )
        else:
            raise HTTPException(status_code=404, detail="Tournament image not found or download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading tournament image: {str(e)}")


@app.get("/images/manager/download")
async def download_manager_image(
    manager_id: int = Query(..., description="Manager ID")
):
    """Download manager image"""
    try:
        image_path = sofascore.download_manager_image(manager_id)
        if image_path and os.path.exists(image_path):
            return FileResponse(
                path=image_path,
                media_type="image/png",
                filename=f"manager_{manager_id}.png"
            )
        else:
            raise HTTPException(status_code=404, detail="Manager image not found or download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading manager image: {str(e)}")

# Advanced endpoints
@app.get("/football/tournament/videos")
async def get_tournament_videos(
    tournament_id: int = Query(..., description="Tournament ID"),
    season_id: int = Query(..., description="Season ID")
):
    """Get tournament videos"""
    return handle_api_call(sofascore.get_tournament_videos, tournament_id, season_id)

@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify the server is working"""
    try:
        # Test basic functionality
        test_results = {
            "server_status": "running",
            "sofascore_module": "imported",
            "available_functions": len([name for name in dir(sofascore) if callable(getattr(sofascore, name)) and not name.startswith('_')]),
            "timestamp": datetime.now().isoformat()
        }
        
        # Try a simple API call (today's events)
        today = datetime.now().strftime("%Y-%m-%d")
        events_result = sofascore.get_scheduled_events(today)
        test_results["sample_api_call"] = "success" if events_result else "failed"
        
        return {"success": True, "test_results": test_results}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==================== NEW ENDPOINTS ====================

@app.get("/player/{player_id}")
async def get_player_profile(
    player_id: int = Path(..., description="Player ID")
):
    """Get player profile (Official Path)"""
    return handle_api_call(sofascore.get_player, player_id)

@app.get("/team/{team_id}")
async def get_team_profile(
    team_id: int = Path(..., description="Team ID")
):
    """Get team profile (Official Path)"""
    return handle_api_call(sofascore.get_team, team_id)

@app.get("/team/{team_id}/players")
async def get_team_squad(
    team_id: int = Path(..., description="Team ID")
):
    """Get team players (Official Path)"""
    return handle_api_call(sofascore.get_team_players, team_id)

@app.get("/event/{event_id}/h2h")
async def get_event_h2h(
    event_id: int = Path(..., description="Event ID")
):
    """Get H2H (Official Path)"""
    return handle_api_call(sofascore.get_event_h2h, event_id)

@app.get("/event/{event_id}/incidents")
async def get_event_incidents(
    event_id: int = Path(..., description="Event ID")
):
    """Get Incidents (Official Path)"""
    return handle_api_call(sofascore.get_event_incidents, event_id)

@app.get("/search/all")
async def search_all(
    q: str = Query(..., description="Search query")
):
    """Search (Official Path)"""
    return handle_api_call(sofascore.search, q)

@app.get("/football/tournament/details")
async def get_tournament_details(
    tournament_id: int = Query(..., description="Tournament ID")
):
    """Get tournament details"""
    return handle_api_call(sofascore.get_tournament_details, tournament_id)

@app.get("/football/tournament/seasons")
async def get_tournament_seasons(
    tournament_id: int = Query(..., description="Tournament ID")
):
    """Get tournament seasons"""
    return handle_api_call(sofascore.get_tournament_seasons, tournament_id)

if __name__ == "__main__":
    print("🚀 Starting SofaScore API Server...")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔗 API Root: http://localhost:8000/")
    print("🏥 Health Check: http://localhost:8000/health")
    print("🧪 Test Endpoint: http://localhost:8000/test")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info"
    )
