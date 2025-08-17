'use client'

import { useState } from 'react'
import { GlassCard } from '@/shared/components/GlassCard'
import { Filter, Star, Calendar, Code, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOptions {
  minStars?: number
  language?: string
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all'
  sortBy?: 'stars' | 'updated' | 'created' | 'name'
}

interface DiscoveryFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  className?: string
}

const languages = [
  'All Languages',
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'Ruby',
  'PHP'
]

const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }
]

const sortOptions = [
  { value: 'stars', label: 'Most Stars' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'name', label: 'Name (A-Z)' }
]

export function DiscoveryFilters({ onFilterChange, className }: DiscoveryFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    minStars: 0,
    language: 'All Languages',
    dateRange: 'all',
    sortBy: 'stars'
  })
  
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: string | number) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <GlassCard className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronDown 
            className={cn(
              'w-5 h-5 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Language Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Code className="w-4 h-4" />
              Language
            </label>
            <select
              value={filters.language}
              onChange={(e) => updateFilter('language', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang} value={lang} className="bg-gray-900">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Stars Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Star className="w-4 h-4" />
              Minimum Stars
            </label>
            <input
              type="number"
              min="0"
              value={filters.minStars}
              onChange={(e) => updateFilter('minStars', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value} className="bg-gray-900">
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Filter className="w-4 h-4" />
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateFilter('minStars', 100)}
          className={cn(
            'px-3 py-1 rounded-lg text-sm transition-colors',
            filters.minStars === 100
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'bg-white/10 hover:bg-white/20'
          )}
        >
          ⭐ 100+ stars
        </button>
        <button
          onClick={() => updateFilter('minStars', 1000)}
          className={cn(
            'px-3 py-1 rounded-lg text-sm transition-colors',
            filters.minStars === 1000
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'bg-white/10 hover:bg-white/20'
          )}
        >
          🌟 1000+ stars
        </button>
        <button
          onClick={() => updateFilter('dateRange', 'week')}
          className={cn(
            'px-3 py-1 rounded-lg text-sm transition-colors',
            filters.dateRange === 'week'
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              : 'bg-white/10 hover:bg-white/20'
          )}
        >
          📅 This week
        </button>
        <button
          onClick={() => {
            const resetFilters = {
              minStars: 0,
              language: 'All Languages',
              dateRange: 'all' as const,
              sortBy: 'stars' as const
            }
            setFilters(resetFilters)
            onFilterChange(resetFilters)
          }}
          className="px-3 py-1 rounded-lg text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </GlassCard>
  )
}