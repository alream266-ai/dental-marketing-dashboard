import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Plus, Sparkles, CheckCheck, X } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'

interface Review {
  id: number; reviewer_name: string; rating: number; body: string
  platform: string; sentiment: string; status: string
  response_draft: string; response_posted: string; created_at: string
}

interface Summary { total: number; avg_rating: number; positive: number; neutral: number; negative: number; pending: number }

const EMPTY = { reviewer_name: '', rating: 5, body: '', platform: 'google' }

export default function ReviewManagement() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [selected, setSelected] = useState<Review | null>(null)
  const [draftingId, setDraftingId] = useState<number | null>(null)
  const qc = useQueryClient()

  const { data: reviews = [] } = useQuery<Review[]>({ queryKey: ['reviews'], queryFn: () => api.get('/reviews').then(r => r.data) })
  const { data: summary } = useQuery<Summary>({ queryKey: ['reviews-summary'], queryFn: () => api.get('/reviews/summary').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/reviews', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); qc.invalidateQueries({ queryKey: ['reviews-summary'] }); setShowForm(false); setForm(EMPTY) }
  })
  const draftMutation = useMutation({
    mutationFn: (id: number) => api.post(`/reviews/${id}/draft-response`).then(r => r.data),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      setDraftingId(null)
      setSelected(s => s?.id === id ? { ...s, response_draft: data.draft } : s)
    }
  })
  const markRespondedMutation = useMutation({
    mutationFn: ({ id, response_posted }: any) => api.put(`/reviews/${id}`, { status: 'responded', response_posted }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); setSelected(null) }
  })

  const Stars = ({ n }: { n: number }) => (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
    </span>
  )

  return (
    <div className="p-8">
      <PageHeader title="Review Management" description="Monitor patient reviews and generate PIPEDA-compliant AI responses."
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}><Plus size={16} /> Add Review</button>} />

      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            ['Total', summary.total, 'bg-slate-100 text-slate-700'],
            [`Avg ${summary.avg_rating}★`, 'Rating', 'bg-amber-50 text-amber-700'],
            [summary.positive, 'Positive', 'bg-green-50 text-green-700'],
            [summary.neutral, 'Neutral', 'bg-slate-100 text-slate-600'],
            [summary.negative, 'Negative', 'bg-red-50 text-red-700'],
          ].map(([val, label, cls], i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${cls}`}>
              <div className="text-2xl font-bold">{val}</div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card p-5 mb-5">
          <div className="flex justify-between mb-3"><h3 className="font-semibold">Add Review</h3><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Reviewer Name</label><input className="input" value={form.reviewer_name} onChange={e => setForm(f => ({ ...f, reviewer_name: e.target.value }))} /></div>
            <div><label className="label">Rating</label>
              <select className="input" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Review Text</label><textarea className="input" rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>Add</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Stars n={r.rating} />
                  <span className="font-medium text-sm text-slate-800">{r.reviewer_name || 'Anonymous'}</span>
                  <StatusBadge status={r.sentiment || 'neutral'} />
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{r.body}</p>
                {r.response_posted && <p className="text-xs text-green-700 mt-1">✓ Response posted</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  className="btn-secondary text-xs flex items-center gap-1"
                  onClick={() => { setDraftingId(r.id); draftMutation.mutate(r.id); setSelected(r) }}
                  disabled={draftMutation.isPending && draftingId === r.id}
                >
                  <Sparkles size={12} />
                  {draftMutation.isPending && draftingId === r.id ? 'Drafting…' : 'Draft Response'}
                </button>
                {r.response_draft && r.status === 'pending' && (
                  <button className="btn-primary text-xs flex items-center gap-1" onClick={() => setSelected(r)}>
                    <CheckCheck size={12} /> Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="card p-12 text-center">
            <Star size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No reviews yet. Add your first review to get started.</p>
          </div>
        )}
      </div>

      {selected && selected.response_draft && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">AI Response Draft</h3><button onClick={() => setSelected(null)}><X size={18} /></button></div>
            <p className="text-sm text-slate-600 mb-3 italic">"{selected.body}"</p>
            <textarea className="input mb-4" rows={6} defaultValue={selected.response_draft}
              onChange={e => setSelected(s => s ? { ...s, response_draft: e.target.value } : null)} />
            <div className="flex gap-3">
              <button className="btn-primary flex items-center gap-2" onClick={() => markRespondedMutation.mutate({ id: selected.id, response_posted: selected.response_draft })}>
                <CheckCheck size={14} /> Mark as Responded
              </button>
              <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(selected.response_draft); }}>Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
