"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, TrendingUp, User } from "lucide-react"
import { useEffect, useState } from "react"

interface Activity {
  id: string
  type: "sale" | "purchase" | "stock_update" | "user_action"
  description: string
  timestamp: string
  amount?: number
  user: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const token = localStorage.getItem('token')
        const [salesRes, purchasesRes] = await Promise.all([
          fetch('/api/sales?limit=3', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/purchases?limit=2', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])
        
        const recentActivities: Activity[] = []
        
        if (salesRes.ok) {
          const salesData = await salesRes.json()
          const sales = salesData.data?.sales || []
          sales.forEach((sale: any) => {
            recentActivities.push({
              id: sale._id,
              type: 'sale',
              description: `Sale completed - ${sale.items?.length || 0} items`,
              timestamp: new Date(sale.createdAt).toLocaleString(),
              amount: sale.totalAmount,
              user: sale.createdBy || 'Unknown'
            })
          })
        }
        
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json()
          const purchases = purchasesData.data?.purchases || []
          purchases.forEach((purchase: any) => {
            recentActivities.push({
              id: purchase._id,
              type: 'purchase',
              description: `Purchase order created - ${purchase.items?.length || 0} items`,
              timestamp: new Date(purchase.createdAt).toLocaleString(),
              amount: purchase.totalAmount,
              user: purchase.createdBy || 'Unknown'
            })
          })
        }
        
        // Sort by timestamp (most recent first)
        recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setActivities(recentActivities.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRecentActivity()
  }, [])

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "sale":
        return <ShoppingCart className="h-4 w-4 text-green-600" />
      case "purchase":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case "stock_update":
        return <Package className="h-4 w-4 text-yellow-600" />
      case "user_action":
        return <User className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityBadge = (type: Activity["type"]) => {
    switch (type) {
      case "sale":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Sale
          </Badge>
        )
      case "purchase":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Purchase
          </Badge>
        )
      case "stock_update":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Stock
          </Badge>
        )
      case "user_action":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Action
          </Badge>
        )
      default:
        return <Badge variant="secondary">Activity</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityBadge(activity.type)}
                  {activity.amount && (
                    <span className="text-sm font-medium text-foreground">${activity.amount.toFixed(2)}</span>
                  )}
                </div>
                <p className="text-sm text-foreground">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
