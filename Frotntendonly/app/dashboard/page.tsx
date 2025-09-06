"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StockSummaryCards } from "@/components/dashboard/stock-summary-cards"
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { getCurrentUser } from "@/lib/auth"

export default function DashboardPage() {
  const user = getCurrentUser()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}</h1>
              <p className="text-muted-foreground">Here's what's happening with your inventory today</p>
            </div>
            <QuickActions />
          </div>

          {/* Summary Cards */}
          <StockSummaryCards />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Chart - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <SalesChart />
            </div>

            {/* Low Stock Alerts */}
            <div className="lg:col-span-1">
              <LowStockAlerts />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
