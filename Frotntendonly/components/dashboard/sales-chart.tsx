"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

const mockData = [
  { name: "Jan", sales: 4000, purchases: 2400 },
  { name: "Feb", sales: 3000, purchases: 1398 },
  { name: "Mar", sales: 2000, purchases: 9800 },
  { name: "Apr", sales: 2780, purchases: 3908 },
  { name: "May", sales: 1890, purchases: 4800 },
  { name: "Jun", sales: 2390, purchases: 3800 },
  { name: "Jul", sales: 3490, purchases: 4300 },
]

export function SalesChart() {
  const [data, setData] = useState(mockData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales & Purchases Overview</CardTitle>
          <CardDescription>Monthly comparison of sales and purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales & Purchases Overview</CardTitle>
        <CardDescription>Monthly comparison of sales and purchases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-muted-foreground" fontSize={12} />
              <YAxis className="text-muted-foreground" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} name="Sales" />
              <Line type="monotone" dataKey="purchases" stroke="hsl(var(--accent))" strokeWidth={2} name="Purchases" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
