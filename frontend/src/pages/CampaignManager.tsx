import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Megaphone, Pencil, Trash2, X } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'

interface Campaign {
  id: number; name: string; campaign_type: string; status: string
  budget: number; spend: number; goal: string; start_date: string | null
  end_date: string | null; impressions: number; clicks: number
  calls: number; bookings: number; notes: string; created_at: string
}

const EMPTY = { name: '', campaign_type: 'social', goal: '', budget: 0, start_date: '', end_date: '', notes: '' }

export default function CampaignManager() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState(EMPTY)
  const qc = useQueryClient()

  const { data: campaigns = [] } = useQuery<Campaign[]>({ queryKey: ['campaigns'], queryFn: () => api.get('/campaigns').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/campaigns', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); setForm(EMPTY) }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/campaigns/${id}`, d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setEditing(null) }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] })
  })

  const statusColors: Record<string, string> = { draft: 'bg-slate-100', active: 'bg-green-50', paused: 'bg-yellow-50', completed: 'bg-blue-50' }

  return (
    <div className="p-8">
      <PageHeader title="Campaign Manager" description="Create and track all your marketing campaigns in one place."
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}><Plus size={16} /> New Campaign</button>} />

      {(showForm || editing) && (
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{editing ? 'Edit Campaign' : 'New Campaign'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['name','Campaign Name'],['goal','Goal']].map(([k,l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" value={editing ? (editing as any)[k] : (form as any)[k]}
                  onChange={e => editing ? setEditing(v => ({ ...v!, [k]: e.target.value })) : setForm(v => ({ ...v, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Type</label>
              <select className="input" value={editing?.campaign_type || form.campaign_type}
                onChange={e => editing ? setEditing(v => ({ ...v!, campaign_type: e.target.value })) : setForm(v => ({ ...v, campaign_type: e.target.value }))}>
                {['social','email','paid_ads','referral','seo'].map(t => <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Budget (CAD)</label>
              <input type="number" className="input" value={editing?.budget || form.budget}
                onChange={e => editing ? setEditing(v => ({ ...v!, budget: Number(e.target.value) })) : setForm(v => ({ ...v, budget: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary" onClick={() => editing ? updateMutation.mutate(editing) : createMutation.mutate(form)}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : 'Save'}
            </button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No campaigns yet. Create your first campaign to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className={`card p-4 ${statusColors[c.status] || ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-slate-400 uppercase">{c.campaign_type.replace('_',' ')}</span>
                  </div>
                  <p className="text-sm text-slate-600">{c.goal}</p>
                  <div className="flex gap-6 mt-2 text-xs text-slate-500">
                    <span>Budget: ${c.budget}</span>
                    <span>Spend: ${c.spend}</span>
                    <span>Clicks: {c.clicks}</span>
                    <span>Bookings: {c.bookings}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select className="text-xs border border-slate-200 rounded px-2 py-1" value={c.status}
                    onChange={e => updateMutation.mutate({ id: c.id, status: e.target.value })}>
                    {['draft','active','paused','completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-white rounded"><Pencil size={14} className="text-slate-500" /></button>
                  <button onClick={() => deleteMutation.mutate(c.id)} className="p-1.5 hover:bg-white rounded"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
