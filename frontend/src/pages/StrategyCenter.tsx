import { useState, useRef } from 'react'
import { Loader2, Target } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import AIOutput from '../components/shared/AIOutput'

export default function StrategyCenter() {
  const [form, setForm] = useState({
    timeframe: 90,
    current_patients: 20,
    target_patients: 35,
    budget: '1000-1500',
    services_to_promote: 'general dentistry, teeth whitening',
    challenge: 'attracting new patients in a competitive market',
  })
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setOutput('')
    setStreaming(true)

    try {
      const resp = await fetch('/api/strategy/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: abortRef.current.signal,
      })
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6)
            if (payload === '[DONE]') { setStreaming(false); return }
            try { const { text } = JSON.parse(payload); setOutput(o => o + text) } catch {}
          }
        }
      }
    } catch (e: any) { if (e.name !== 'AbortError') console.error(e) }
    finally { setStreaming(false) }
  }

  return (
    <div className="p-8">
      <PageHeader title="Strategy Center" description="Get a custom 30/60/90-day marketing strategy for your Maple Ridge dental practice." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Strategy Timeframe</label>
              <select className="input" value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: Number(e.target.value) }))}>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Current New Patients/Month</label>
                <input type="number" className="input" value={form.current_patients} onChange={e => setForm(f => ({ ...f, current_patients: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Target New Patients/Month</label>
                <input type="number" className="input" value={form.target_patients} onChange={e => setForm(f => ({ ...f, target_patients: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="label">Monthly Marketing Budget (CAD)</label>
              <input className="input" placeholder="e.g. 1000-1500" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
            <div>
              <label className="label">Services to Promote</label>
              <input className="input" value={form.services_to_promote} onChange={e => setForm(f => ({ ...f, services_to_promote: e.target.value }))} />
            </div>
            <div>
              <label className="label">Biggest Current Challenge</label>
              <textarea className="input" rows={2} value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={streaming}>
              {streaming ? <><Loader2 size={16} className="animate-spin" /> Building Strategy…</> : <><Target size={16} /> Build My Strategy</>}
            </button>
          </form>
        </div>

        <div>
          {(output || streaming) ? (
            <AIOutput content={output} streaming={streaming} />
          ) : (
            <div className="card p-10 text-center text-slate-400">
              <Target size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Fill in your goals and click Build to get a personalized marketing strategy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
