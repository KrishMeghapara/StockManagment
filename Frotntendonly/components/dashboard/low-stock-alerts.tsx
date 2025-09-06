"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface LowStockItem {
  id: string
  name: string
  currentStock: number
  minStock: number
  category: string
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLowStockItems([
        { id: "1", name: "Wireless Headphones", currentStock: 5, minStock: 20, category: "Electronics" },
        { id: "2", name: "Office Chair", currentStock: 2, minStock: 10, category: "Furniture" },
        { id: "3", name: "Laptop Stand", currentStock: 8, minStock: 15, category: "Accessories" },
        { id: "4", name: "USB Cable", currentStock: 12, minStock: 50, category: "Electronics" },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Items that need restocking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Items that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No low stock items</p>
            </div>
          ) : (
            <>
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.currentStock} / {item.minStock} units
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${item.currentStock === 0 ? "text-red-600" : "text-yellow-600"}`}
                    >
                      {item.currentStock === 0 ? "Out of Stock" : "Low Stock"}
                    </div>
                  </div>
                </div>
              ))}
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/products/low-stock">View All Low Stock Items</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
