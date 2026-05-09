import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Loader2, CheckCircle, Edit2 } from 'lucide-react'
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
    if (url) analyzeMutation.mutate(url)
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
        description="Scrape your dental website and extract your brand profile to power all AI content generation."
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
