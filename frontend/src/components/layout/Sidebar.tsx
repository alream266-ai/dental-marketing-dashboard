import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Globe, PenSquare, Target, Megaphone,
  Users, BarChart2, Search, Star
} from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/website-analyzer', icon: Globe, label: 'Website Analyzer' },
  { to: '/content-studio', icon: PenSquare, label: 'Content Studio' },
  { to: '/strategy', icon: Target, label: 'Strategy Center' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/leads', icon: Users, label: 'Lead Pipeline' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/seo', icon: Search, label: 'Local SEO' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">D</div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Dental Marketing</div>
            <div className="text-slate-400 text-xs">Maple Ridge, BC</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">Powered by Claude AI</div>
      </div>
    </aside>
  )
}
