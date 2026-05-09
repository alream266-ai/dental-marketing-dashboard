import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import WebsiteAnalyzer from './pages/WebsiteAnalyzer'
import ContentStudio from './pages/ContentStudio'
import StrategyCenter from './pages/StrategyCenter'
import CampaignManager from './pages/CampaignManager'
import LeadGeneration from './pages/LeadGeneration'
import Analytics from './pages/Analytics'
import LocalSEO from './pages/LocalSEO'
import ReviewManagement from './pages/ReviewManagement'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/website-analyzer" element={<WebsiteAnalyzer />} />
            <Route path="/content-studio" element={<ContentStudio />} />
            <Route path="/strategy" element={<StrategyCenter />} />
            <Route path="/campaigns" element={<CampaignManager />} />
            <Route path="/leads" element={<LeadGeneration />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/seo" element={<LocalSEO />} />
            <Route path="/reviews" element={<ReviewManagement />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
