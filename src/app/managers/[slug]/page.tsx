import { Metadata } from 'next'
import { db } from '@/db/client'
import { managers, teams } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBaseUrl } from '@/utils/url'
import Link from 'next/link'
import SemanticLinks from '@/components/SemanticLinks'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params
    const [manager] = await db.select().from(managers).where(eq(managers.slug, resolvedParams.slug)).limit(1)

    if (!manager) {
        return {
            title: 'Manager Not Found | Kick AI',
            description: 'The requested football manager could not be found.'
        }
    }

    const baseUrl = getBaseUrl()
    const title = `${manager.name} - Manager Profile & Career | Kick AI`
    const description = `${manager.name} football manager profile. ${manager.teamName ? `Currently managing ${manager.teamName}.` : ''} View career stats, team history, and matches.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${baseUrl}/managers/${manager.slug}`,
            type: 'profile',
            images: manager.imageUrl ? [{ url: manager.imageUrl, width: 400, height: 400 }] : undefined,
        },
    }
}

export default async function ManagerPage({ params }: PageProps) {
    const resolvedParams = await params
    const [manager] = await db.select().from(managers).where(eq(managers.slug, resolvedParams.slug)).limit(1)

    if (!manager) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Manager Not Found</h1>
                    <p className="text-gray-400 mb-8">The manager you're looking for doesn't exist.</p>
                    <Link href="/managers" className="bg-gold-500 text-black px-6 py-3 rounded-lg font-bold">
                        Browse All Managers
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch current team if manager has one
    let currentTeam: any = null
    if (manager.teamId) {
        const [team] = await db.select().from(teams).where(eq(teams.teamId, manager.teamId)).limit(1)
        currentTeam = team
    }

    const baseUrl = getBaseUrl()

    // Structured data for SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: manager.name,
        jobTitle: 'Football Manager',
        nationality: manager.nationality,
        image: manager.imageUrl,
        url: `${baseUrl}/managers/${manager.slug}`,
        worksFor: currentTeam ? {
            '@type': 'SportsTeam',
            name: currentTeam.name,
        } : undefined,
    }

    // Calculate age if birth date is available
    let age: number | null = null
    if (manager.dateOfBirthTs) {
        const birthDate = new Date(manager.dateOfBirthTs * 1000)
        age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    }

    return (
        <div className="min-h-screen bg-black">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Hero */}
            <div className="bg-gradient-to-b from-blue-900/30 to-black py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Manager Image */}
                        <div className="w-48 h-48 rounded-full bg-gray-800 overflow-hidden border-4 border-gold-500/30">
                            {manager.imageUrl ? (
                                <img
                                    src={manager.imageUrl}
                                    alt={manager.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    👨‍💼
                                </div>
                            )}
                        </div>

                        {/* Manager Info */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-2 text-blue-400 mb-2 justify-center md:justify-start">
                                <span>👨‍💼</span>
                                <span className="text-sm font-semibold uppercase tracking-wider">Manager</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
                                {manager.name}
                            </h1>
                            {manager.teamName && (
                                <p className="text-xl text-gold-400">
                                    {currentTeam ? (
                                        <Link href={`/teams/${currentTeam.slug}`} className="hover:underline">
                                            {manager.teamName}
                                        </Link>
                                    ) : (
                                        manager.teamName
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-6xl mx-auto px-4 -mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {manager.nationality && (
                        <div className="bg-black-900/60 border border-blue-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                            <div className="text-2xl font-black text-blue-400">{manager.nationality}</div>
                            <div className="text-gray-400 text-sm">Nationality</div>
                        </div>
                    )}
                    {age && (
                        <div className="bg-black-900/60 border border-green-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                            <div className="text-3xl font-black text-green-400">{age}</div>
                            <div className="text-gray-400 text-sm">Age</div>
                        </div>
                    )}
                    {manager.teamName && (
                        <div className="bg-black-900/60 border border-gold-500/30 rounded-xl p-6 text-center backdrop-blur-lg">
                            <div className="text-xl font-black text-gold-400 truncate">{manager.teamName}</div>
                            <div className="text-gray-400 text-sm">Current Team</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Career Info */}
                <div className="bg-black-900/40 border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">📋 Profile</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                        <div>
                            <span className="text-gray-500">Full Name:</span>
                            <span className="ml-2 text-white">{manager.name}</span>
                        </div>
                        {manager.nationality && (
                            <div>
                                <span className="text-gray-500">Nationality:</span>
                                <span className="ml-2 text-white">{manager.nationality}</span>
                            </div>
                        )}
                        {manager.teamName && (
                            <div>
                                <span className="text-gray-500">Current Team:</span>
                                <span className="ml-2 text-white">{manager.teamName}</span>
                            </div>
                        )}
                        {age && (
                            <div>
                                <span className="text-gray-500">Age:</span>
                                <span className="ml-2 text-white">{age} years old</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Team Section */}
                {currentTeam && (
                    <div className="bg-black-900/40 border border-white/10 rounded-2xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">⚽ Current Team</h2>
                        <Link
                            href={`/teams/${currentTeam.slug}`}
                            className="flex items-center gap-4 hover:bg-white/5 p-4 rounded-xl transition-all"
                        >
                            {currentTeam.imageUrl && (
                                <img src={currentTeam.imageUrl} alt={currentTeam.name} className="w-16 h-16" />
                            )}
                            <div>
                                <div className="text-xl font-bold text-white">{currentTeam.name}</div>
                                <div className="text-gray-400">{currentTeam.country}</div>
                            </div>
                            <span className="ml-auto text-gold-400">View Team →</span>
                        </Link>
                    </div>
                )}

                {/* SEO Crosslinks */}
                <SemanticLinks showTeams={true} showDateArchives={true} />
            </div>
        </div>
    )
}
