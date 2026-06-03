import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Loader2, CheckCircle, Edit2, Search, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'

interface BrandProfile {
  practice_name: string
  website_url: string
  location: string
  phone: string
  address: string
  brand_tone: string
  mission: string
  target_audience: string[]
  services: string[]
  value_props: string[]
  doctor_names: string[]
  accepts_new_patients: boolean
  hours_summary: string
}

type CheckStatus = 'pass' | 'warn' | 'fail'

interface SeoCheck {
  category: string
  label: string
  status: CheckStatus
  detail: string
}

interface SeoRecommendation {
  title: string
  priority: 'high' | 'medium' | 'low'
  impact: string
  action: string
}

interface SeoReport {
  url: string
  render_mode: 'rendered' | 'static'
  overall_score: number
  grade: string
  counts: { pass: number; warn: number; fail: number }
  category_scores: { category: string; score: number }[]
  checks: SeoCheck[]
  recommendations: SeoRecommendation[]
}

export default function WebsiteAnalyzer() {
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<BrandProfile>>({})
  const qc = useQueryClient()

  const { data: profile } = useQuery<BrandProfile>({
    queryKey: ['brand-profile'],
    queryFn: () => api.get('/brand-profile').then(r => r.data),
  })

  const analyzeMutation = useMutation({
    mutationFn: (websiteUrl: string) => api.post('/analyze-website', { url: websiteUrl }).then(r => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['brand-profile'], data)
    },
  })

  const auditMutation = useMutation<SeoReport, unknown, string>({
    mutationFn: (websiteUrl: string) => api.post('/seo-audit', { url: websiteUrl }).then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<BrandProfile>) => api.put('/brand-profile', {
      ...data,
      target_audience: Array.isArray(data.target_audience) ? data.target_audience : (data.target_audience as any || '').split(',').map((s: string) => s.trim()),
      services: Array.isArray(data.services) ? data.services : (data.services as any || '').split(',').map((s: string) => s.trim()),
      value_props: Array.isArray(data.value_props) ? data.value_props : (data.value_props as any || '').split(',').map((s: string) => s.trim()),
    }).then(r => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['brand-profile'], data)
      setEditing(false)
    },
  })

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (url) {
      analyzeMutation.mutate(url)
      auditMutation.mutate(url)
    }
  }

  const startEdit = () => {
    if (profile) {
      setEditData({
        ...profile,
        target_audience: profile.target_audience?.join(', ') as any,
        services: profile.services?.join(', ') as any,
        value_props: profile.value_props?.join(', ') as any,
      })
      setEditing(true)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Website Analyzer"
        description="Scan your dental website for a professional SEO audit and extract your brand profile to power all AI content generation."
      />

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Analyze Your Website</h2>
        <form onSubmit={handleAnalyze} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="https://yourdentalpractice.ca"
            value={url}
            onChange={e => setUrl(e.target.value)}
            type="url"
          />
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={analyzeMutation.isPending || !url}
          >
            {analyzeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            {analyzeMutation.isPending ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>
        {analyzeMutation.isPending && (
          <p className="mt-3 text-sm text-slate-500 animate-pulse">Scraping pages and extracting brand information with AI…</p>
        )}
        {analyzeMutation.isError && (
          <p className="mt-3 text-sm text-red-600">Error: {(analyzeMutation.error as any)?.response?.data?.detail || 'Failed to analyze website.'}</p>
        )}
      </div>

      {(auditMutation.isPending || auditMutation.isError || auditMutation.data) && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Search size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-800">SEO Audit</h2>
          </div>

          {auditMutation.isPending && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-6">
              <Loader2 size={16} className="animate-spin" /> Running technical SEO checks and generating recommendations…
            </div>
          )}
          {auditMutation.isError && (
            <p className="text-sm text-red-600">SEO audit failed: {(auditMutation.error as any)?.response?.data?.detail || 'Could not audit website.'}</p>
          )}

          {auditMutation.data && <SeoReportView report={auditMutation.data} />}
        </div>
      )}

      {profile && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              <h2 className="font-semibold text-slate-800">Brand Profile</h2>
            </div>
            {!editing && (
              <button onClick={startEdit} className="btn-secondary flex items-center gap-2 text-sm">
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              {[
                ['practice_name', 'Practice Name'],
                ['location', 'Location'],
                ['phone', 'Phone'],
                ['address', 'Address'],
                ['brand_tone', 'Brand Tone'],
                ['mission', 'Mission Statement'],
                ['hours_summary', 'Hours Summary'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    className="input"
                    value={(editData as any)[key] || ''}
                    onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {[
                ['target_audience', 'Target Audience (comma-separated)'],
                ['services', 'Services (comma-separated)'],
                ['value_props', 'Value Propositions (comma-separated)'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={(editData as any)[key] || ''}
                    onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button className="btn-primary" onClick={() => saveMutation.mutate(editData)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
                </button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Practice Name" value={profile.practice_name} />
              <Field label="Location" value={profile.location} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Brand Tone" value={profile.brand_tone} />
              <Field label="Mission" value={profile.mission} span />
              <Field label="Hours" value={profile.hours_summary} span />
              <TagField label="Target Audience" tags={profile.target_audience} />
              <TagField label="Services" tags={profile.services} />
              <TagField label="Value Propositions" tags={profile.value_props} span />
            </div>
          )}
        </div>
      )}

      {!profile && !analyzeMutation.isPending && (
        <div className="card p-12 text-center">
          <Globe size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Enter your website URL above to get started.</p>
          <p className="text-slate-400 text-sm mt-1">The AI will scrape your site and extract your brand voice, services, and audience.</p>
        </div>
      )}
    </div>
  )
}

function scoreColor(score: number) {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-500', ring: 'text-green-500' }
  if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'text-amber-500' }
  return { text: 'text-red-600', bg: 'bg-red-500', ring: 'text-red-500' }
}

function SeoReportView({ report }: { report: SeoReport }) {
  const c = scoreColor(report.overall_score)
  const circumference = 2 * Math.PI * 42
  const dash = (report.overall_score / 100) * circumference

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={c.ring} strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${c.text}`}>{report.overall_score}</span>
            <span className="text-xs text-slate-400">Grade {report.grade}</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-sm text-slate-500 break-all">{report.url}</p>
            <span
              className={`badge ${report.render_mode === 'rendered' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}
              title={report.render_mode === 'rendered'
                ? 'Analyzed the fully rendered page (JavaScript executed in a headless browser).'
                : 'Analyzed static HTML only — the headless browser was unavailable.'}
            >
              {report.render_mode === 'rendered' ? 'Rendered DOM' : 'Static HTML'}
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-600"><CheckCircle size={15} /> {report.counts.pass} passed</span>
            <span className="flex items-center gap-1.5 text-amber-600"><AlertTriangle size={15} /> {report.counts.warn} warnings</span>
            <span className="flex items-center gap-1.5 text-red-600"><XCircle size={15} /> {report.counts.fail} failed</span>
          </div>
        </div>
      </div>

      {/* Category scores */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Category Scores</h3>
        <div className="space-y-2.5">
          {report.category_scores.map(cat => {
            const cc = scoreColor(cat.score)
            return (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-36 shrink-0">{cat.category}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cc.bg} rounded-full transition-all`} style={{ width: `${cat.score}%` }} />
                </div>
                <span className={`text-sm font-medium w-10 text-right ${cc.text}`}>{cat.score}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Checklist</h3>
        <div className="space-y-1.5">
          {report.checks.map((chk, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
              <StatusIcon status={chk.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{chk.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">{chk.category}</span>
                </div>
                <p className="text-sm text-slate-500">{chk.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Prioritized Recommendations</h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <PriorityBadge priority={rec.priority} />
                  <span className="font-medium text-slate-800 text-sm">{rec.title}</span>
                </div>
                <p className="text-sm text-slate-500 mb-1.5">{rec.impact}</p>
                <p className="text-sm text-slate-700 flex items-start gap-1.5">
                  <ChevronRight size={15} className="mt-0.5 shrink-0 text-brand-500" />
                  {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
  if (status === 'warn') return <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
  return <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  }
  return <span className={`badge ${styles[priority]} capitalize`}>{priority}</span>
}

function Field({ label, value, span }: { label: string, value: string, span?: boolean }) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || '—'}</p>
    </div>
  )
}

function TagField({ label, tags, span }: { label: string, tags: string[], span?: boolean }) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags?.length ? tags.map(t => (
          <span key={t} className="badge bg-brand-100 text-brand-700">{t}</span>
        )) : <span className="text-sm text-slate-400">—</span>}
      </div>
    </div>
  )
}
