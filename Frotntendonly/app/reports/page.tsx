"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { addDays } from "date-fns"

const COLORS = ["#0891b2", "#ec4899", "#10b981", "#f59e0b", "#ef4444"]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [reportType, setReportType] = useState("overview")
  const [salesData, setSalesData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const [salesRes, productsRes, categoriesRes] = await Promise.all([
          fetch('/api/reports/sales'),
          fetch('/api/products'),
          fetch('/api/categories')
        ])
        
        if (salesRes.ok) {
          const salesData = await salesRes.json()
          setSalesData(salesData.data?.monthlySales || [])
        }
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          const products = productsData.data?.products || []
          
          // Top products by sales
          const topProds = products
            .sort((a: any, b: any) => (b.totalSales || 0) - (a.totalSales || 0))
            .slice(0, 5)
            .map((p: any) => ({
              name: p.name,
              sales: p.totalSales || 0,
              quantity: p.totalQuantitySold || 0
            }))
          setTopProducts(topProds)
          
          // Inventory data by category
          const categoryStats = products.reduce((acc: any, product: any) => {
            const category = product.category?.name || 'Uncategorized'
            if (!acc[category]) {
              acc[category] = { inStock: 0, lowStock: 0, outOfStock: 0 }
            }
            
            if (product.currentStock === 0) {
              acc[category].outOfStock++
            } else if (product.currentStock <= product.minimumStock) {
              acc[category].lowStock++
            } else {
              acc[category].inStock++
            }
            
            return acc
          }, {})
          
          const inventoryStats = Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
            category,
            ...stats
          }))
          setInventoryData(inventoryStats)
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          const categories = categoriesData.data?.categories || []
          
          const categoryStats = categories.map((cat: any, index: number) => ({
            name: cat.name,
            value: Math.max(10, (cat.productCount || 0) * 5), // Mock percentage
            sales: (cat.productCount || 0) * 1000 // Mock sales
          }))
          setCategoryData(categoryStats)
        }
        
      } catch (error) {
        console.error('Failed to fetch reports data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchReportsData()
  }, [])



  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/reports/export?format=${format}&type=${reportType}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="financial">Financial Report</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={() => handleExport("pdf")} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$328,000</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">640</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500" />
              -2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +15.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales & Profit Trend</CardTitle>
            <CardDescription>Monthly sales and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                <Line type="monotone" dataKey="sales" stroke="#0891b2" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Sales"]} />
                <Bar dataKey="sales" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>Stock levels across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inStock" stackId="a" fill="#10b981" name="In Stock" />
                <Bar dataKey="lowStock" stackId="a" fill="#f59e0b" name="Low Stock" />
                <Bar dataKey="outOfStock" stackId="a" fill="#ef4444" name="Out of Stock" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Summary</CardTitle>
            <CardDescription>Latest sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "INV-001", customer: "John Doe", amount: 1250, date: "2024-01-15" },
                { id: "INV-002", customer: "Jane Smith", amount: 890, date: "2024-01-14" },
                { id: "INV-003", customer: "Bob Johnson", amount: 2100, date: "2024-01-14" },
                { id: "INV-004", customer: "Alice Brown", amount: 650, date: "2024-01-13" },
              ].map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{sale.id}</p>
                    <p className="text-sm text-muted-foreground">{sale.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${sale.amount}</p>
                    <p className="text-sm text-muted-foreground">{sale.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Wireless Mouse", current: 5, minimum: 10, status: "critical" },
                { name: "USB Cable", current: 8, minimum: 15, status: "low" },
                { name: "Phone Case", current: 12, minimum: 20, status: "low" },
                { name: "Screen Protector", current: 3, minimum: 10, status: "critical" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.current} | Min: {item.minimum}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === "critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
