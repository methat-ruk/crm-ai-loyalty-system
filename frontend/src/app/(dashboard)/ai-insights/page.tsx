'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Sparkles, User, Tag, Clock, ChevronLeft, ChevronRight, AlertCircle, Loader2, Search, X } from 'lucide-react'
import { clsx } from 'clsx'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import aiService from '@/services/aiService'
import { customerService } from '@/services/customerService'
import type { AIInsight, Customer, InsightType, Tier } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<Tier, string> = {
  BRONZE:   'bg-orange-100 text-orange-700',
  SILVER:   'bg-slate-100 text-slate-600',
  GOLD:     'bg-amber-100 text-amber-700',
  PLATINUM: 'bg-violet-100 text-violet-700',
}

const TYPE_LABEL: Record<InsightType, string> = {
  CUSTOMER_SEGMENT:         'Customer Segment',
  CHURN_RISK:               'Churn Risk',
  PROMOTION_RECOMMENDATION: 'Promo Recommendation',
  BEHAVIOR_ANALYSIS:        'Behavior Analysis',
  GENERAL:                  'General',
}

const TYPE_COLOR: Record<InsightType, string> = {
  CUSTOMER_SEGMENT:         'bg-blue-100 text-blue-700',
  CHURN_RISK:               'bg-red-100 text-red-700',
  PROMOTION_RECOMMENDATION: 'bg-indigo-100 text-indigo-700',
  BEHAVIOR_ANALYSIS:        'bg-emerald-100 text-emerald-700',
  GENERAL:                  'bg-slate-100 text-slate-600',
}

const PROVIDER_BADGE: Record<string, { label: string; color: string }> = {
  mock:   { label: 'Mock Mode', color: 'bg-slate-100 text-slate-600' },
  groq:   { label: 'Groq',      color: 'bg-orange-100 text-orange-700' },
  openai: { label: 'OpenAI',    color: 'bg-emerald-100 text-emerald-700' },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

type HistoryInsight = AIInsight & {
  customer: { id: string; firstName: string; lastName: string; tier: Tier } | null
}

// ─── Content renderer ─────────────────────────────────────────────────────────

const InsightContent = ({ content }: { content: string }) => (
  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
    {content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-slate-800 dark:text-slate-100 mt-2 first:mt-0">{line.slice(2, -2)}</p>
      }
      return <p key={i}>{line}</p>
    })}
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiInsightsPage() {
  const [provider, setProvider] = useState<{ provider: string; model: string } | null>(null)

  // Customer search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Customer insight state
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [customerResult, setCustomerResult] = useState<{
    insight: AIInsight
    customer: { id: string; firstName: string; lastName: string; tier: Tier; totalPoints: number }
  } | null>(null)

  // Promo recommendation state
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoResult, setPromoResult] = useState<AIInsight | null>(null)

  // History state
  const [history, setHistory] = useState<HistoryInsight[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)

  useEffect(() => {
    aiService.getProvider().then(setProvider).catch(() => null)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSelectedCustomer(null)
    setCustomerResult(null)
    setCustomerError('')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await customerService.getAll({ search: value.trim(), limit: 6 })
        setSearchResults(res.data)
        setShowDropdown(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
  }, [])

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setSearchQuery(`${c.firstName} ${c.lastName}`)
    setShowDropdown(false)
    setCustomerResult(null)
    setCustomerError('')
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setSearchQuery('')
    setSearchResults([])
    setCustomerResult(null)
    setCustomerError('')
  }

  const loadHistory = (page: number) => {
    setHistoryLoading(true)
    aiService.getInsights(page)
      .then((res) => {
        setHistory(res.data as HistoryInsight[])
        setHistoryTotalPages(res.totalPages)
        setHistoryPage(page)
      })
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => { loadHistory(1) }, [])

  const handleCustomerInsight = async () => {
    if (!selectedCustomer) return
    setCustomerError('')
    setCustomerResult(null)
    setCustomerLoading(true)
    try {
      const res = await aiService.generateCustomerInsight(selectedCustomer.id)
      setCustomerResult(res as typeof customerResult)
      loadHistory(1)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.message
        setCustomerError(Array.isArray(msg) ? msg.join(', ') : msg)
      } else {
        setCustomerError('Something went wrong')
      }
    } finally {
      setCustomerLoading(false)
    }
  }

  const handlePromoRecommendation = async () => {
    setPromoError('')
    setPromoResult(null)
    setPromoLoading(true)
    try {
      const res = await aiService.generatePromoRecommendation()
      setPromoResult(res.insight)
      loadHistory(1)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.message
        setPromoError(Array.isArray(msg) ? msg.join(', ') : msg)
      } else {
        setPromoError('Something went wrong')
      }
    } finally {
      setPromoLoading(false)
    }
  }

  const providerInfo = provider ? (PROVIDER_BADGE[provider.provider] ?? PROVIDER_BADGE.mock) : null

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">AI Insights</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Analyze customers and get AI-powered recommendations</p>
        </div>
        {providerInfo && (
          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', providerInfo.color)}>
            <Sparkles className="w-3 h-3 inline mr-1" />
            {providerInfo.label}
            {provider?.model && provider.provider !== 'mock' && (
              <span className="ml-1 opacity-70">· {provider.model}</span>
            )}
          </span>
        )}
      </div>

      {/* Two-column tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Customer Insight */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Customer Insight</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Behavior summary &amp; churn risk</p>
            </div>
          </div>

          {/* Search input + dropdown */}
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search by name or email…"
                className={clsx('text-sm pl-8 pr-8', selectedCustomer && 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-900/10')}
              />
              {searchQuery && (
                <button
                  onClick={handleClearCustomer}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5 cursor-pointer" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500">No customers found</div>
                ) : (
                  searchResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.email}</p>
                      </div>
                      <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ml-2', TIER_COLOR[c.tier])}>
                        {c.tier}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleCustomerInsight}
            disabled={customerLoading || !selectedCustomer}
            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {customerLoading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Generating…</>
              : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Insight</>
            }
          </Button>

          {customerError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {customerError}
            </div>
          )}

          {customerResult && (
            <div className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {customerResult.customer.firstName} {customerResult.customer.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customerResult.customer.totalPoints.toLocaleString()} pts
                  </p>
                </div>
                <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', TIER_COLOR[customerResult.customer.tier as Tier])}>
                  {customerResult.customer.tier}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3">
                <InsightContent content={customerResult.insight.content} />
              </div>
            </div>
          )}

          {!customerResult && !customerLoading && (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500">
              <User className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Search a customer to generate insight</p>
            </div>
          )}
        </div>

        {/* Promo Recommendation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 shrink-0">
                <Tag className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Promo Recommendation</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-suggested campaign strategy</p>
              </div>
            </div>
            <Button
              onClick={handlePromoRecommendation}
              disabled={promoLoading}
              className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white shrink-0"
            >
              {promoLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-3.5 h-3.5 mr-1" />Generate</>
              }
            </Button>
          </div>

          {promoError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {promoError}
            </div>
          )}

          {promoResult && (
            <div className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4">
              <InsightContent content={promoResult.content} />
            </div>
          )}

          {!promoResult && !promoLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
              <Tag className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Click Generate to get campaign recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Insights</h2>
        </div>

        {historyLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <Sparkles className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No insights generated yet</p>
            <p className="text-xs mt-1">Use the tools above to generate your first insight</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {history.map((item) => (
                <div key={item.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', TYPE_COLOR[item.type])}>
                          {TYPE_LABEL[item.type]}
                        </span>
                        {item.customer && (
                          <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', TIER_COLOR[item.customer.tier])}>
                            {item.customer.firstName} {item.customer.lastName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.content.replace(/\*\*/g, '')}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">Page {historyPage} of {historyTotalPages}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadHistory(historyPage - 1)}
                    disabled={historyPage === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadHistory(historyPage + 1)}
                    disabled={historyPage === historyTotalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
