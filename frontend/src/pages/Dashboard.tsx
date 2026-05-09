import { useQuery } from '@tanstack/react-query'
import { Users, Megaphone, Star, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface KPIs {
  total_leads: number
  new_leads_this_month: number
  active_campaigns: number
  avg_review_score: number
  total_reviews: number
  content_published_this_week: number
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: any, label: string, value: string | number, sub?: string, color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

const quickLinks = [
  { to: '/website-analyzer', label: 'Analyze Website', desc: 'Extract brand profile from your site' },
  { to: '/content-studio', label: 'Create Content', desc: 'Generate posts, blogs & emails with AI' },
  { to: '/strategy', label: 'Build Strategy', desc: 'Get a 30/60/90-day marketing plan' },
  { to: '/leads', label: 'Add Lead', desc: 'Track new patient inquiries' },
]

export default function Dashboard() {
  const { data: kpis } = useQuery<KPIs>({
    queryKey: ['kpis'],
    queryFn: () => api.get('/analytics/kpis').then(r => r.data),
    refetchInterval: 60000,
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Good morning 👋</h1>
        <p className="text-slate-500 mt-1">Here's your dental marketing overview for Maple Ridge.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard icon={Users} label="New Leads This Month" value={kpis?.new_leads_this_month ?? '—'} sub={`${kpis?.total_leads ?? 0} total`} color="bg-purple-500" />
        <KPICard icon={Megaphone} label="Active Campaigns" value={kpis?.active_campaigns ?? '—'} color="bg-brand-500" />
        <KPICard icon={Star} label="Avg Review Score" value={kpis ? `${kpis.avg_review_score}/5` : '—'} sub={`${kpis?.total_reviews ?? 0} reviews`} color="bg-amber-500" />
        <KPICard icon={FileText} label="Content This Week" value={kpis?.content_published_this_week ?? '—'} sub="pieces generated" color="bg-green-500" />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ to, label, desc }) => (
            <Link key={to} to={to} className="card p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-slate-800">{label}</span>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-800">Getting Started</h2>
        </div>
        <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
          <li>Go to <Link to="/website-analyzer" className="text-brand-600 hover:underline">Website Analyzer</Link> and enter your dental office website URL to extract your brand profile.</li>
          <li>Use <Link to="/content-studio" className="text-brand-600 hover:underline">Content Studio</Link> to generate social media posts, blog articles, and email campaigns.</li>
          <li>Build your <Link to="/strategy" className="text-brand-600 hover:underline">Marketing Strategy</Link> with a 30/60/90-day AI-generated action plan.</li>
          <li>Track patient inquiries in the <Link to="/leads" className="text-brand-600 hover:underline">Lead Pipeline</Link>.</li>
          <li>Monitor and respond to Google reviews in <Link to="/reviews" className="text-brand-600 hover:underline">Review Management</Link>.</li>
        </ol>
      </div>
    </div>
  )
}
