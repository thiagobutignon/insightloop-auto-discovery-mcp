'use client'

import { useState, useEffect } from 'react'
import { Star, Eye, GitFork, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitHubActionsProps {
  repoUrl: string
  className?: string
}

interface GitHubStats {
  stars: number
  watchers: number
  forks: number
  isStarred?: boolean
  isWatching?: boolean
}

export function GitHubActions({ repoUrl, className }: GitHubActionsProps) {
  const [stats, setStats] = useState<GitHubStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract owner and repo from URL
  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') }
    }
    return null
  }

  useEffect(() => {
    const fetchGitHubStats = async () => {
      const repoInfo = extractRepoInfo(repoUrl)
      if (!repoInfo) {
        setError('Invalid GitHub URL')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              // Add auth token if available
              ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
              })
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch repository data')
        }

        const data = await response.json()
        setStats({
          stars: data.stargazers_count,
          watchers: data.watchers_count,
          forks: data.forks_count
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load GitHub stats')
      } finally {
        setLoading(false)
      }
    }

    fetchGitHubStats()
  }, [repoUrl])

  const handleStar = async () => {
    // Open GitHub star page in new tab
    // In a real app, this would use GitHub OAuth to star directly
    window.open(`${repoUrl}/stargazers`, '_blank')
  }

  const handleWatch = async () => {
    // Open GitHub watch page in new tab
    window.open(`${repoUrl}/subscription`, '_blank')
  }

  const handleFork = async () => {
    // Open GitHub fork page in new tab
    window.open(`${repoUrl}/fork`, '_blank')
  }

  if (loading) {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className="h-8 w-20 bg-white/10 animate-pulse rounded-md" />
        <div className="h-8 w-20 bg-white/10 animate-pulse rounded-md" />
        <div className="h-8 w-20 bg-white/10 animate-pulse rounded-md" />
      </div>
    )
  }

  if (error || !stats) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleStar}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors text-sm font-medium"
        title="Star on GitHub"
      >
        <Star className="w-4 h-4" />
        <span>{stats.stars.toLocaleString()}</span>
      </button>

      <button
        onClick={handleWatch}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors text-sm font-medium"
        title="Watch on GitHub"
      >
        <Eye className="w-4 h-4" />
        <span>{stats.watchers.toLocaleString()}</span>
      </button>

      <button
        onClick={handleFork}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors text-sm font-medium"
        title="Fork on GitHub"
      >
        <GitFork className="w-4 h-4" />
        <span>{stats.forks.toLocaleString()}</span>
      </button>

      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        title="Open in GitHub"
      >
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </a>
    </div>
  )
}

// Compact version for cards
export function GitHubStatsCompact({ repoUrl }: { repoUrl: string }) {
  const [stats, setStats] = useState<GitHubStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const repoInfo = extractRepoInfo(repoUrl)
      if (!repoInfo) return

      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          setStats({
            stars: data.stargazers_count,
            watchers: data.watchers_count,
            forks: data.forks_count
          })
        }
      } catch {
        // Silently fail for compact version
      }
    }

    fetchStats()
  }, [repoUrl])

  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') }
    }
    return null
  }

  if (!stats) return null

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <span className="flex items-center gap-1">
        <Star className="w-3 h-3" />
        {stats.stars.toLocaleString()}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {stats.watchers.toLocaleString()}
      </span>
      <span className="flex items-center gap-1">
        <GitFork className="w-3 h-3" />
        {stats.forks.toLocaleString()}
      </span>
    </div>
  )
}