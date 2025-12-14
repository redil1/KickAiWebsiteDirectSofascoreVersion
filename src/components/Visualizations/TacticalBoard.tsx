'use client'

interface PlayerPosition {
    player: { name: string, id: number, jerseyNumber: string }
    averageX: number
    averageY: number
    pointsCount: number
}

interface TacticalBoardProps {
    homePositions: PlayerPosition[]
    awayPositions: PlayerPosition[]
    homeTeam: string
    awayTeam: string
}

export default function TacticalBoard({ homePositions, awayPositions, homeTeam, awayTeam }: TacticalBoardProps) {
    // Show message if no data available
    if ((!homePositions || homePositions.length === 0) && (!awayPositions || awayPositions.length === 0)) {
        return (
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-white text-xl font-bold flex items-center gap-2 mb-4">
                    📋 Average Tactical Positions
                </h3>
                <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-3">🗺️</div>
                    <p>Tactical position data not available for this match</p>
                    <p className="text-sm mt-1">Data becomes available during/after the match</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                📋 Average Tactical Positions
            </h3>

            <div className="relative aspect-[105/68] w-full bg-emerald-900/40 rounded-lg border border-white/10 overflow-hidden">
                {/* Visual Field Lines - Vertical Pitch View */}

                {/* Middle Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full"></div>

                {/* Home Team Players */}
                {homePositions?.map((pos, i) => (
                    <div
                        key={`home-${i}`}
                        className="absolute w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10"
                        style={{
                            left: `${pos.averageX}%`,
                            top: `${pos.averageY}%`
                        }}
                        title={pos.player.name}
                    >
                        {pos.player.jerseyNumber}
                    </div>
                ))}

                {/* Away Team Players - Mirror X? Usually API returns absolute 0-100 */}
                {/* Checking data structure, usually Away is mirrored. Assuming 0-100 is full field Left->Right */}
                {awayPositions?.map((pos, i) => (
                    <div
                        key={`away-${i}`}
                        className="absolute w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10"
                        style={{
                            left: `${pos.averageX}%`, // API usually provides correct absolute coordinates
                            top: `${pos.averageY}%`
                        }}
                        title={pos.player.name}
                    >
                        {pos.player.jerseyNumber}
                    </div>
                ))}

                {/* Team Labels */}
                <div className="absolute top-2 left-4 text-xs font-bold text-blue-400">{homeTeam}</div>
                <div className="absolute top-2 right-4 text-xs font-bold text-red-400">{awayTeam}</div>
            </div>
        </div>
    )
}
