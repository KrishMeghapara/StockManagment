"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface StockSummary {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
}

export function StockSummaryCards() {
  const [summary, setSummary] = useState<StockSummary>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with actual API
    const fetchSummary = async () => {
      try {
        // Mock data for demonstration
        setTimeout(() => {
          setSummary({
            totalProducts: 1247,
            totalValue: 89650.5,
            lowStockItems: 23,
            outOfStockItems: 5,
          })
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Failed to fetch stock summary:", error)
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [])

  const cards = [
    {
      title: "Total Products",
      value: summary.totalProducts.toLocaleString(),
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Value",
      value: `$${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Low Stock Items",
      value: summary.lowStockItems.toString(),
      icon: TrendingDown,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Out of Stock",
      value: summary.outOfStockItems.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
