'use client'

import { useMemo } from 'react'

interface GraphPoint {
    minute: number
    value: number
}

interface MomentumGraphProps {
    data: GraphPoint[]
    homeTeam: string
    awayTeam: string
    className?: string
}

export default function MomentumGraph({ data, homeTeam, awayTeam, className = '' }: MomentumGraphProps) {
    const points = data || []

    // Dimensions
    const width = 1000
    const height = 200
    const centerY = height / 2

    const pathData = useMemo(() => {
        if (points.length === 0) return ''

        // Normalize x (time) to fit width
        const maxMinute = Math.max(90, points[points.length - 1]?.minute || 90)
        const scaleX = width / maxMinute

        // Normalize y (value) to fit height (assume max pressure is around +/- 100)
        // We find true max to act as scale, but cap it to avoid flat lines
        const maxVal = Math.max(50, ...points.map(p => Math.abs(p.value)))
        const scaleY = (height / 2 - 10) / maxVal

        // Build the path
        // M startX startY L ...
        let d = `M 0 ${centerY} `

        points.forEach(p => {
            const x = p.minute * scaleX
            const y = centerY - (p.value * scaleY) // Invert Y (screen coords)
            d += `L ${x} ${y} `
        })

        // Close the path to center line for fill
        d += `L ${points[points.length - 1].minute * scaleX} ${centerY} Z`

        return d
    }, [points])

    if (points.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-black-900/50 rounded-xl border border-gray-800 h-48 ${className}`}>
                <span className="text-gray-500 text-sm">No momentum data available yet.</span>
            </div>
        )
    }

    const lastPoint = points[points.length - 1]
    const currentMomentum = lastPoint?.value || 0
    const isHomeDominating = currentMomentum > 0

    return (
        <div className={`relative bg-black-900/80 rounded-xl border border-gray-800 p-4 ${className}`}>
            {/* Header / Current Status */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Attack Momentum</h3>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                </div>
                <div className="text-xs font-mono">
                    {isHomeDominating ? (
                        <span className="text-green-400">{homeTeam} Pressure ({currentMomentum})</span>
                    ) : currentMomentum < 0 ? (
                        <span className="text-blue-400">{awayTeam} Pressure ({Math.abs(currentMomentum)})</span>
                    ) : (
                        <span className="text-gray-500">Neutral</span>
                    )}
                </div>
            </div>

            {/* The Graph */}
            <div className="relative w-full h-32 overflow-hidden">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="momentumGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" /> {/* Green Top (Home) */}
                            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" /> {/* Blue Bottom (Away) */}
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Zero Line */}
                    <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Data Path */}
                    <path
                        d={pathData}
                        fill="url(#momentumGradient)"
                        stroke="none"
                        filter="url(#glow)"
                    />

                    {/* Line Highlight */}
                    <path
                        d={pathData.replace(/Z$/, '')} // Remove close for stroke
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1.5"
                    />

                </svg>
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                <span>0'</span>
                <span>45'</span>
                <span>90'</span>
                <span>90'+</span>
            </div>
        </div>
    )
}
