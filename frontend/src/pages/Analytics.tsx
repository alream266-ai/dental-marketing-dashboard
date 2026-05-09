import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart2 } from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export default function Analytics() {
  const { data: leadsOverTime = [] } = useQuery({ queryKey: ['leads-time'], queryFn: () => api.get('/analytics/leads-over-time').then(r => r.data) })
  const { data: leadsBySource = [] } = useQuery({ queryKey: ['leads-source'], queryFn: () => api.get('/analytics/leads-by-source').then(r => r.data) })
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaign-perf'], queryFn: () => api.get('/analytics/campaign-performance').then(r => r.data) })
  const { data: kpis } = useQuery({ queryKey: ['kpis'], queryFn: () => api.get('/analytics/kpis').then(r => r.data) })

  return (
    <div className="p-8">
      <PageHeader title="Analytics" description="Track the performance of your marketing activities across all channels." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Leads', kpis?.total_leads ?? '—'],
          ['New This Month', kpis?.new_leads_this_month ?? '—'],
          ['Active Campaigns', kpis?.active_campaigns ?? '—'],
          ['Avg Review', kpis ? `${kpis.avg_review_score}/5` : '—'],
        ].map(([label, val]) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{val}</div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Leads Over Time</h3>
          {leadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={leadsOverTime}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Leads by Source</h3>
          {leadsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {leadsBySource.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Campaign Performance</h3>
        {campaigns.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaigns} barSize={20}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#e2e8f0" name="Impressions" />
              <Bar dataKey="clicks" fill="#0ea5e9" name="Clicks" />
              <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center">
      <div className="text-center">
        <BarChart2 size={32} className="mx-auto mb-2 text-slate-200" />
        <p className="text-xs text-slate-400">No data yet — data will appear as you use the dashboard.</p>
      </div>
    </div>
  )
}
