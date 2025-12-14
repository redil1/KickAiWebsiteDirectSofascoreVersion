'use client'

import { motion } from 'framer-motion'

interface GraphPoint {
    minute: number
    value: number
}

interface AttackMomentumProps {
    data: GraphPoint[]
    homeTeam: string
    awayTeam: string
}

export default function AttackMomentum({ data, homeTeam, awayTeam }: AttackMomentumProps) {
    if (!data || data.length === 0) return null

    // Normalize values to fit graph height
    const maxValue = Math.max(...data.map(p => Math.abs(p.value)))
    const height = 150
    const width = 100 // Percent

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                📈 Attack Momentum
            </h3>

            <div className="relative h-[150px] w-full flex items-center">
                {/* Center Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 z-0" />

                {/* Graph Bars */}
                <div className="flex items-end h-full w-full gap-[1px]">
                    {data.map((point, i) => {
                        const isHome = point.value > 0
                        const barHeight = (Math.abs(point.value) / maxValue) * (height / 2)

                        return (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${barHeight}px` }}
                                transition={{ duration: 0.5, delay: i * 0.01 }}
                                className={`flex-1 min-w-[2px] ${isHome ? 'bg-green-500' : 'bg-red-500'} opacity-80 hover:opacity-100 transition-opacity`}
                                style={{
                                    marginBottom: isHome ? '50%' : 'auto',
                                    marginTop: isHome ? 'auto' : '50%',
                                    borderRadius: '1px'
                                }}
                                title={`Minute ${point.minute}: ${point.value > 0 ? homeTeam : awayTeam}`}
                            />
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-wider">
                <span className="text-green-500">{homeTeam} Dominance</span>
                <span className="text-red-500">{awayTeam} Dominance</span>
            </div>
        </div>
    )
}
