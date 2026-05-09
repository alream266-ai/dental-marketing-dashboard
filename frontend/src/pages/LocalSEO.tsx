import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, Code, Trash2 } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'

interface Keyword { id: number; keyword: string; search_intent: string; difficulty: string; priority: number; category: string }

const intentColors: Record<string, string> = { transactional: 'bg-green-100 text-green-700', informational: 'bg-blue-100 text-blue-700', navigational: 'bg-purple-100 text-purple-700' }
const diffColors: Record<string, string> = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }

export default function LocalSEO() {
  const [services, setServices] = useState('general dentistry, teeth whitening, Invisalign, implants, emergency dentistry')
  const [schema, setSchema] = useState('')
  const qc = useQueryClient()

  const { data: keywords = [] } = useQuery<Keyword[]>({ queryKey: ['seo-keywords'], queryFn: () => api.get('/seo/keywords').then(r => r.data) })

  const generateMutation = useMutation({
    mutationFn: (svcs: string) => api.post('/seo/keywords', { services: svcs.split(',').map(s => s.trim()) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seo-keywords'] })
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/seo/keywords/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seo-keywords'] })
  })
  const schemaMutation = useMutation({
    mutationFn: () => api.get('/seo/schema-markup').then(r => r.data),
    onSuccess: (d) => setSchema(d.schema)
  })

  return (
    <div className="p-8">
      <PageHeader title="Local SEO Tools" description="Keyword research and optimization tools for Maple Ridge dental search visibility." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold mb-3">Generate Keyword List</h3>
          <textarea className="input mb-3" rows={2} value={services} onChange={e => setServices(e.target.value)} placeholder="Comma-separated services" />
          <button className="btn-primary flex items-center gap-2" onClick={() => generateMutation.mutate(services)} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Search size={14} /> Generate Keywords</>}
          </button>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Schema Markup</h3>
          <p className="text-xs text-slate-500 mb-3">Generate LocalBusiness JSON-LD code for your website</p>
          <button className="btn-secondary w-full flex items-center gap-2 text-sm" onClick={() => schemaMutation.mutate()} disabled={schemaMutation.isPending}>
            <Code size={14} /> Generate Schema
          </button>
          {schema && (
            <div className="mt-3">
              <textarea className="input text-xs font-mono" rows={6} value={schema} readOnly />
              <button className="btn-secondary text-xs mt-2 w-full" onClick={() => navigator.clipboard.writeText(schema)}>Copy JSON-LD</button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Keyword List ({keywords.length})</h3>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="badge bg-green-100 text-green-700">transactional</span>
              <span className="badge bg-blue-100 text-blue-700">informational</span>
              <span className="badge bg-purple-100 text-purple-700">navigational</span>
            </div>
          </div>
        </div>
        {keywords.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {keywords.map(k => (
              <div key={k.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50">
                <div className="flex-1 text-sm text-slate-800">{k.keyword}</div>
                <span className={`badge ${intentColors[k.search_intent] || 'bg-slate-100 text-slate-600'}`}>{k.search_intent}</span>
                <span className={`badge ${diffColors[k.difficulty] || 'bg-slate-100 text-slate-600'}`}>{k.difficulty}</span>
                <div className="flex items-center gap-1 w-20">
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${k.priority * 10}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{k.priority}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(k.id)} className="p-1 hover:bg-slate-200 rounded"><Trash2 size={12} className="text-slate-400" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Search size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm">Click "Generate Keywords" to build your local SEO keyword list.</p>
          </div>
        )}
      </div>
    </div>
  )
}
