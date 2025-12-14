
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { sofascoreService } from '@/services/sofascore'
import MetricBeacon from '@/components/MetricBeacon'
import { Metadata } from 'next'

// Revalidate every hour
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const title = `${slug.charAt(0).toUpperCase() + slug.slice(1)} Football - Live Scores & Streaming`

  return {
    title,
    description: `Watch live ${slug} football matches. Get fixtures, scores, and results for all ${slug} leagues and tournaments.`,
    alternates: {
      canonical: `/leagues/${slug}`
    }
  }
}

export default async function LeaguePage({ params }: PageProps) {
  const { slug } = await params

  // Fetch category info (using getCategories and filtering)
  const categoriesData = await sofascoreService.getCategories()
  const categories = (categoriesData as any)?.categories || []
  const category = categories.find((c: any) => c.slug === slug)

  if (!category) {
    // We don't 404 immediately to allow for "soft" landing pages even if API misses
    // But ideally we should.
  }

  const categoryName = category ? category.name : slug.replace(/-/g, ' ')

  return (
    <div className="min-h-screen bg-black-900 text-white">
      <MetricBeacon event="league_view" />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black-800 to-black-900 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {category?.flag && (
            <div className="flex justify-center mb-6">
              <img
                src={`https://api.sofascore.app/api/v1/category/${category.id}/image`}
                alt={categoryName}
                className="w-24 h-24 object-contain drop-shadow-2xl"
              />
            </div>
          )}
          <h1 className="text-5xl font-black mb-4 capitalize">
            <span className="text-gold-500">{categoryName}</span> Football
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Live streaming, fixtures, and results from all top {categoryName} competitions.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-black-800/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Upcoming Matches</h2>
              <p className="text-gray-400 italic">
                Check our <Link href="/matches" className="text-gold-400 hover:underline">Matches Page</Link> for the full schedule.
              </p>
              {/* In V2: Inject filtered matches here */}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-black-800/50 rounded-2xl p-6 border border-white/10 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-white">🏠 Home</Link></li>
                <li><Link href="/matches" className="text-gray-300 hover:text-white">⚽ All Matches</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white">💎 Premium Access</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
