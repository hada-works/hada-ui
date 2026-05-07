/**
 * Re-exports DashboardPage from the new ops-dashboard feature.
 * The monolithic implementation has been split into:
 *   features/ops-dashboard/shared/  — types, mock data, primitives
 *   features/ops-dashboard/tabs/    — one file per leadership tab
 *   features/ops-dashboard/index.tsx — shell (header + tab bar)
 */
export { DashboardPage } from "@/features/ops-dashboard"
