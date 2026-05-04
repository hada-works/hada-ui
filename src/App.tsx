import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppProvider } from "@/store/app-store"
import { AppLayout } from "@/components/layout/AppLayout"

import { DashboardPage, MembersPage, SettingsPage, AnalyticsPage, NotificationsPage } from "@/features/workspace"
import { FeedbacksPage, FeedbackDetailPage, NewBoardPage } from "@/features/feedbacks"
import { IssuesPage, IssueDetailPage } from "@/features/issues"
import { ProjectsPage, NewProjectPage } from "@/features/projects"
import { BulkBuyApprovalPage, PurchasesDashboardPage, PurchasesSettingsPage } from "@/features/purchases"
import { GbpDashboardPage, GbpInsightsPage, GbpLocationsPage, GbpReviewsPage, GbpSettingsPage } from "@/features/gbp-audits"
import { ProductsDashboardPage, ProductsPerformancePage, ProductsInOutApprovalPage, ProductsAssortmentsPage } from "@/features/products"

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Workspace */}
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/members"       element={<MembersPage />} />
            <Route path="/analytics"     element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings"      element={<SettingsPage />} />

            {/* Feedbacks */}
            <Route path="/feedbacks"                          element={<FeedbacksPage />} />
            <Route path="/feedbacks/new-board"                element={<NewBoardPage />} />
            <Route path="/feedbacks/board/:boardId"           element={<FeedbacksPage />} />
            <Route path="/feedbacks/board/:boardId/settings"  element={<NewBoardPage />} />
            <Route path="/feedbacks/:id"                      element={<FeedbackDetailPage />} />

            {/* Issues */}
            <Route path="/issues"     element={<IssuesPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />

            {/* Projects */}
            <Route path="/projects"                      element={<ProjectsPage />} />
            <Route path="/projects/new"                  element={<NewProjectPage />} />
            <Route path="/projects/:projectId"           element={<IssuesPage />} />
            <Route path="/projects/:projectId/settings"  element={<NewProjectPage />} />

            {/* Purchases */}
            <Route path="/purchases/bulk-buy"  element={<BulkBuyApprovalPage />} />
            <Route path="/purchases/insights"  element={<PurchasesDashboardPage />} />
            <Route path="/purchases/settings"  element={<PurchasesSettingsPage />} />

            {/* GBP Audits */}
            <Route path="/gbp/dashboard"  element={<GbpDashboardPage />} />
            <Route path="/gbp/insights"   element={<GbpInsightsPage />} />
            <Route path="/gbp/locations"  element={<GbpLocationsPage />} />
            <Route path="/gbp/reviews"    element={<GbpReviewsPage />} />
            <Route path="/gbp/settings"   element={<GbpSettingsPage />} />

            {/* Products */}
            <Route path="/products/dashboard"   element={<ProductsDashboardPage />} />
            <Route path="/products/performance" element={<ProductsPerformancePage />} />
            <Route path="/products/in-out"       element={<ProductsInOutApprovalPage />} />
            <Route path="/products/assortments" element={<ProductsAssortmentsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
