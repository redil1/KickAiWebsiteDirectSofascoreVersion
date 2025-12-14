import { Metadata } from 'next'
import { db } from '@/db/client'
import { managers } from '@/db/schema'
import { sql } from 'drizzle-orm'
import Link from 'next/link'
import SemanticLinks from '@/components/SemanticLinks'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Football Managers & Coaches | Manager Profiles | Kick AI',
    description: 'Browse football managers and coaches worldwide. View manager profiles, career stats, current teams, and match history. Premier League, Champions League, La Liga managers.',
    keywords: 'football managers, soccer coaches, manager profiles, Premier League managers, Champions League coaches, team managers',
}

export default async function ManagersIndexPage() {
    let allManagers: any[] = []

    try {
        allManagers = await db.select({
            slug: managers.slug,
            name: managers.name,
            nationality: managers.nationality,
            teamName: managers.teamName,
            imageUrl: managers.imageUrl,
        })
            .from(managers)
            .orderBy(sql`name ASC`)
            .limit(200)
    } catch (error) {
        console.error('Error fetching managers:', error)
    }

    // Group by nationality
    const managersByNationality = allManagers.reduce((acc, manager) => {
        const nat = manager.nationality || 'Unknown'
        if (!acc[nat]) acc[nat] = []
        acc[nat].push(manager)
        return acc
    }, {} as Record<string, any[]>)

    const nationalities = Object.keys(managersByNationality).sort()

    return (
        <div className="min-h-screen bg-black">
            {/* Hero */}
            <div className="bg-gradient-to-b from-blue-600/20 to-black py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        👨‍💼 Football <span className="text-blue-400">Managers</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Explore football managers and coaches worldwide. Career stats and team history.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-6xl mx-auto px-4 -mt-8">
                <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="bg-black-900/60 border border-blue-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                        <div className="text-3xl font-black text-blue-400">{allManagers.length}</div>
                        <div className="text-gray-400 text-sm">Managers</div>
                    </div>
                    <div className="bg-black-900/60 border border-blue-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                        <div className="text-3xl font-black text-green-400">{nationalities.length}</div>
                        <div className="text-gray-400 text-sm">Nationalities</div>
                    </div>
                </div>
            </div>

            {/* Manager List */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {allManagers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">👨‍💼</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Managers Yet</h2>
                        <p className="text-gray-400">Manager data is being populated. Check back soon!</p>
                    </div>
                ) : (
                    <>
                        {/* All Managers Grid */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">🏆 All Managers</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allManagers.slice(0, 24).map((manager) => (
                                    <Link
                                        key={manager.slug}
                                        href={`/managers/${manager.slug}`}
                                        className="group bg-black-900/40 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-all flex items-center gap-4"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                                            {manager.imageUrl ? (
                                                <img src={manager.imageUrl} alt={manager.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">👨‍💼</div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {manager.name}
                                            </h3>
                                            {manager.teamName && (
                                                <div className="text-gold-400 text-sm">{manager.teamName}</div>
                                            )}
                                            {manager.nationality && (
                                                <div className="text-gray-500 text-xs">{manager.nationality}</div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* By Nationality */}
                        {nationalities.slice(0, 10).map((nationality) => (
                            <div key={nationality} className="mb-8">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    🌍 {nationality} ({managersByNationality[nationality].length})
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {managersByNationality[nationality].slice(0, 6).map((manager: any) => (
                                        <Link
                                            key={manager.slug}
                                            href={`/managers/${manager.slug}`}
                                            className="bg-black-900/40 border border-white/10 rounded-lg px-4 py-2 hover:border-blue-500/30 transition-all text-white"
                                        >
                                            {manager.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* SEO Crosslinks */}
                <SemanticLinks showTeams={true} showDateArchives={true} />
            </div>
        </div>
    )
}
