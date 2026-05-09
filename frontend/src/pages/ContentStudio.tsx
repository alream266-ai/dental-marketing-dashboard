import { useState, useRef } from 'react'
import { Loader2, Send } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import AIOutput from '../components/shared/AIOutput'
import api from '../api/client'

type Tab = 'social' | 'blog' | 'email'

const platforms = ['facebook', 'instagram', 'google_business', 'linkedin']
const postTypes = ['educational', 'promotional', 'seasonal', 'community', 'testimonial']
const emailTypes = ['promotional', 'welcome', 'reactivation', 'newsletter', 'appointment_reminder']

export default function ContentStudio() {
  const [tab, setTab] = useState<Tab>('social')
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Social fields
  const [platform, setPlatform] = useState('facebook')
  const [topic, setTopic] = useState('')
  const [postType, setPostType] = useState('educational')
  const [extraDetails, setExtraDetails] = useState('')

  // Blog fields
  const [keyword, setKeyword] = useState('')
  const [wordCount, setWordCount] = useState(1000)

  // Email fields
  const [emailType, setEmailType] = useState('promotional')
  const [goal, setGoal] = useState('')
  const [segment, setSegment] = useState('existing patients')
  const [offer, setOffer] = useState('')

  const stream = async (url: string) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setOutput('')
    setStreaming(true)

    try {
      const resp = await fetch(url, { signal: abortRef.current.signal })
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
            try {
              const { text } = JSON.parse(payload)
              setOutput(o => o + text)
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e)
    } finally {
      setStreaming(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tab === 'social') {
      stream(`/api/generate/social/stream?platform=${platform}&topic=${encodeURIComponent(topic)}&post_type=${postType}&extra_details=${encodeURIComponent(extraDetails)}`)
    } else if (tab === 'blog') {
      stream(`/api/generate/blog/stream?keyword=${encodeURIComponent(keyword)}&word_count=${wordCount}`)
    } else {
      stream(`/api/generate/email/stream?email_type=${emailType}&goal=${encodeURIComponent(goal)}&segment=${encodeURIComponent(segment)}&offer=${encodeURIComponent(offer)}&word_count=200`)
    }
  }

  const canSubmit = !streaming && (
    (tab === 'social' && topic) ||
    (tab === 'blog' && keyword) ||
    (tab === 'email' && goal)
  )

  return (
    <div className="p-8">
      <PageHeader
        title="Content Studio"
        description="Generate social posts, blog articles, and email campaigns with AI — tailored to your brand and Maple Ridge."
      />

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {(['social', 'blog', 'email'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'social' ? 'Social Media' : t === 'blog' ? 'Blog Post' : 'Email Campaign'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'social' && (
              <>
                <div>
                  <label className="label">Platform</label>
                  <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                    {platforms.map(p => <option key={p} value={p}>{p.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Topic *</label>
                  <input className="input" placeholder="e.g. back to school dental checkup" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div>
                  <label className="label">Post Type</label>
                  <select className="input" value={postType} onChange={e => setPostType(e.target.value)}>
                    {postTypes.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Extra Details (optional)</label>
                  <input className="input" placeholder="Any specific offer or detail to include" value={extraDetails} onChange={e => setExtraDetails(e.target.value)} />
                </div>
              </>
            )}

            {tab === 'blog' && (
              <>
                <div>
                  <label className="label">Target Keyword *</label>
                  <input className="input" placeholder="e.g. dentist maple ridge bc" value={keyword} onChange={e => setKeyword(e.target.value)} />
                </div>
                <div>
                  <label className="label">Word Count</label>
                  <select className="input" value={wordCount} onChange={e => setWordCount(Number(e.target.value))}>
                    <option value={800}>~800 words</option>
                    <option value={1000}>~1000 words</option>
                    <option value={1200}>~1200 words</option>
                    <option value={1500}>~1500 words</option>
                  </select>
                </div>
              </>
            )}

            {tab === 'email' && (
              <>
                <div>
                  <label className="label">Email Type</label>
                  <select className="input" value={emailType} onChange={e => setEmailType(e.target.value)}>
                    {emailTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Goal *</label>
                  <input className="input" placeholder="e.g. re-engage patients who haven't visited in 18 months" value={goal} onChange={e => setGoal(e.target.value)} />
                </div>
                <div>
                  <label className="label">Target Segment</label>
                  <input className="input" value={segment} onChange={e => setSegment(e.target.value)} />
                </div>
                <div>
                  <label className="label">Offer / Message</label>
                  <input className="input" placeholder="e.g. free whitening consultation" value={offer} onChange={e => setOffer(e.target.value)} />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={!canSubmit}>
              {streaming ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Send size={16} /> Generate</>}
            </button>
          </form>
        </div>

        <div>
          {(output || streaming) ? (
            <AIOutput content={output} streaming={streaming} />
          ) : (
            <div className="card p-10 text-center text-slate-400">
              <p className="text-sm">Fill in the form and click Generate to see AI-powered content here.</p>
              <p className="text-xs mt-1">Content streams in real-time as it's generated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
