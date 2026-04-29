import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppProvider } from "@/store/app-store"
import { AppLayout } from "@/components/layout/AppLayout"
import { Dashboard } from "@/pages/Dashboard"
import { Feedbacks } from "@/pages/Feedbacks"
import { FeedbackDetail } from "@/pages/FeedbackDetail"
import { NewBoard } from "@/pages/NewBoard"
import { Issues } from "@/pages/Issues"
import { IssueDetail } from "@/pages/IssueDetail"
import { Projects } from "@/pages/Projects"
import { NewProject } from "@/pages/NewProject"
import { Members } from "@/pages/Members"
import { BulkBuyApproval } from "@/pages/BulkBuyApproval"
import { PurchasesDashboard } from "@/pages/PurchasesDashboard"
import { PurchasesSettings } from "@/pages/PurchasesSettings"
import { Analytics } from "@/pages/Analytics"
import { Notifications } from "@/pages/Notifications"
import { Settings } from "@/pages/Settings"

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            {/* Feedbacks */}
            <Route path="/feedbacks" element={<Feedbacks />} />
            <Route path="/feedbacks/new-board" element={<NewBoard />} />
            <Route path="/feedbacks/board/:boardId" element={<Feedbacks />} />
            <Route path="/feedbacks/board/:boardId/settings" element={<NewBoard />} />
            <Route path="/feedbacks/:id" element={<FeedbackDetail />} />
            {/* Issues + Projects */}
            <Route path="/issues" element={<Issues />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:projectId" element={<Issues />} />
            <Route path="/projects/:projectId/settings" element={<NewProject />} />
            {/* Purchases */}
            <Route path="/purchases/bulk-buy" element={<BulkBuyApproval />} />
            <Route path="/purchases/insights" element={<PurchasesDashboard />} />
            <Route path="/purchases/settings" element={<PurchasesSettings />} />
            {/* Secondary */}
            <Route path="/members" element={<Members />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
