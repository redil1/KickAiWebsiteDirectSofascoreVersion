'use client'

import { useState } from 'react'

interface Shot {
    player: { name: string }
    isHome: boolean
    shotType: string
    situation: string
    bodyPart: string
    goalMouthLocation: string
    xg: number
    coordinates: { x: number, y: number }
    time: number
    addedTime?: number
}

interface ShotmapProps {
    shots: Shot[]
    homeTeam: string
    awayTeam: string
}

export default function Shotmap({ shots, homeTeam, awayTeam }: ShotmapProps) {
    const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all')

    const filteredShots = shots.filter(shot => {
        if (filter === 'home') return shot.isHome
        if (filter === 'away') return !shot.isHome
        return true
    })

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    🎯 Shotmap & xG
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white text-black' : 'bg-black/40 text-gray-400'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('home')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filter === 'home' ? 'bg-green-500 text-white' : 'bg-black/40 text-gray-400'}`}
                    >
                        {homeTeam}
                    </button>
                    <button
                        onClick={() => setFilter('away')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filter === 'away' ? 'bg-red-500 text-white' : 'bg-black/40 text-gray-400'}`}
                    >
                        {awayTeam}
                    </button>
                </div>
            </div>

            <div className="relative aspect-[105/68] w-full bg-emerald-900/40 rounded-lg border border-white/10 overflow-hidden">
                {/* Pitch Markings (SVG) */}
                <svg width="100%" height="100%" viewBox="0 0 105 68" className="absolute inset-0 opacity-30">
                    <rect x="0" y="0" width="105" height="68" fill="none" stroke="white" strokeWidth="0.5" />
                    <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="white" strokeWidth="0.5" />
                    <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.5" />

                    {/* Penalty Areas */}
                    <path d="M0,13.84 h16.5 v40.32 h-16.5" fill="none" stroke="white" strokeWidth="0.5" />
                    <path d="M105,13.84 h-16.5 v40.32 h16.5" fill="none" stroke="white" strokeWidth="0.5" />

                    {/* Goal Areas */}
                    <path d="M0,24.84 h5.5 v18.32 h-5.5" fill="none" stroke="white" strokeWidth="0.5" />
                    <path d="M105,24.84 h-5.5 v18.32 h5.5" fill="none" stroke="white" strokeWidth="0.5" />
                </svg>

                {/* Shots */}
                {filteredShots.map((shot, i) => {
                    // Normalize coordinates (Sofascore likely uses 0-100 percentage)
                    // Invert x for away team if needed to align attacks direction

                    const cx = shot.coordinates.x // Assuming 0-100 width
                    const cy = shot.coordinates.y // Assuming 0-100 height

                    const isGoal = shot.shotType === 'goal'
                    const size = Math.max(1, shot.xg * 5) // Scale dot by xG

                    return (
                        <div
                            key={i}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 shadow-sm
                                ${isGoal ? 'z-10 animate-pulse' : 'z-0 hover:z-10'}
                            `}
                            style={{
                                left: `${cx}%`,
                                top: `${cy}%`,
                                width: `${isGoal ? '12px' : '8px'}`,
                                height: `${isGoal ? '12px' : '8px'}`,
                                backgroundColor: isGoal ? '#fbbf24' : shot.isHome ? '#22c55e' : '#ef4444',
                            }}
                            title={`${shot.player.name} (${shot.shotType}) - xG: ${shot.xg.toFixed(2)}`}
                        />
                    )
                })}
            </div>

            <div className="flex gap-4 mt-4 text-xs text-gray-400 justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> {homeTeam}
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> {awayTeam}
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse border border-black"></div> Goal
                </div>
            </div>
        </div>
    )
}
