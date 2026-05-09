import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, X, ChevronRight } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'

interface Lead {
  id: number; name: string; email: string; phone: string
  source: string; service_interest: string; status: string
  notes: string; created_at: string
}

const STAGES = ['new', 'contacted', 'appointment_booked', 'converted', 'lost']
const EMPTY = { name: '', email: '', phone: '', source: '', service_interest: '', notes: '' }

export default function LeadGeneration() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ['leads'], queryFn: () => api.get('/leads').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/leads', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setShowForm(false); setForm(EMPTY) }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/leads/${id}`, d).then(r => r.data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['leads'] }); setSelected(data) }
  })

  const byStage = (stage: string) => leads.filter(l => l.status === stage)

  return (
    <div className="p-8">
      <PageHeader title="Lead Pipeline" description="Track prospective patients from first contact to booked appointment."
        action={<button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}><Plus size={16} /> Add Lead</button>} />

      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">New Lead</h3>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['name','Full Name *'],['email','Email'],['phone','Phone'],['source','Source (google, referral, etc)'],['service_interest','Service Interest']].map(([k,l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary" onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? 'Adding…' : 'Add Lead'}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {STAGES.map(stage => (
          <div key={stage} className="bg-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{stage.replace(/_/g,' ')}</span>
              <span className="text-xs bg-white rounded-full px-2 py-0.5 text-slate-600">{byStage(stage).length}</span>
            </div>
            <div className="space-y-2">
              {byStage(stage).map(lead => (
                <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelected(lead)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 truncate">{lead.name}</span>
                    <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{lead.service_interest || lead.source || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{selected.name}</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-slate-500">Email:</span> {selected.email || '—'}</p>
              <p><span className="text-slate-500">Phone:</span> {selected.phone || '—'}</p>
              <p><span className="text-slate-500">Source:</span> {selected.source || '—'}</p>
              <p><span className="text-slate-500">Interest:</span> {selected.service_interest || '—'}</p>
              <p><span className="text-slate-500">Notes:</span> {selected.notes || '—'}</p>
            </div>
            <div className="mb-4">
              <label className="label">Move to Stage</label>
              <select className="input" value={selected.status} onChange={e => updateMutation.mutate({ id: selected.id, status: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Add Note</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={note} onChange={e => setNote(e.target.value)} placeholder="Follow-up note…" />
                <button className="btn-primary" onClick={() => {
                  updateMutation.mutate({ id: selected.id, notes: selected.notes ? selected.notes + '\n' + note : note })
                  setNote('')
                }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
