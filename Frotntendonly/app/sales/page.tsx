"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Eye, Download, DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

interface Sale {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "completed" | "pending" | "cancelled"
  paymentMethod: "cash" | "card" | "bank_transfer"
  createdAt: string
  createdBy: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch('/api/sales')
        if (response.ok) {
          const data = await response.json()
          const backendSales = data.data?.sales || []
          
          const formattedSales: Sale[] = backendSales.map((s: any) => ({
            id: s._id,
            invoiceNumber: s.invoiceNumber || `INV-${s._id.slice(-6)}`,
            customerName: s.customerName || 'Walk-in Customer',
            customerEmail: s.customerEmail || '',
            items: s.items?.map((item: any) => ({
              productId: item.productId || item.product?._id || '',
              productName: item.productName || item.product?.name || 'Unknown Product',
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || item.price || 0,
              total: (item.quantity || 0) * (item.unitPrice || item.price || 0)
            })) || [],
            subtotal: s.subtotal || s.totalAmount || 0,
            tax: s.tax || 0,
            discount: s.discount || 0,
            total: s.totalAmount || s.total || 0,
            status: s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'pending',
            paymentMethod: s.paymentMethod === 'cash' ? 'cash' : s.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
            createdAt: s.createdAt || new Date().toISOString(),
            createdBy: s.createdBy?.name || s.createdBy || 'Unknown User'
          }))
          
          setSales(formattedSales)
          setFilteredSales(formattedSales)
        }
      } catch (error) {
        console.error('Failed to fetch sales:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSales()
  }, [])

  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sale) => sale.status === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((sale) => new Date(sale.createdAt) >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((sale) => new Date(sale.createdAt) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((sale) => new Date(sale.createdAt) >= filterDate)
          break
      }
    }

    setFilteredSales(filtered)
  }, [sales, searchTerm, statusFilter, dateFilter])

  const getStatusBadge = (status: Sale["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: Sale["paymentMethod"]) => {
    switch (method) {
      case "cash":
        return <Badge variant="outline">Cash</Badge>
      case "card":
        return <Badge variant="outline">Card</Badge>
      case "bank_transfer":
        return <Badge variant="outline">Bank Transfer</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate summary stats
  const completedSales = sales.filter((s) => s.status === "completed")
  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalSales = completedSales.length
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sales</h1>
              <p className="text-muted-foreground">Manage sales transactions and invoices</p>
            </div>
            <Button asChild>
              <Link href="/sales/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Sale
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold text-foreground">{totalSales}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold text-foreground">${averageOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground">{sales.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by invoice, customer name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                {filteredSales.length} of {sales.length} sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-4 bg-muted rounded w-1/6"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/6"></div>
                      <div className="h-4 bg-muted rounded w-1/6"></div>
                      <div className="h-4 bg-muted rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div className="font-mono text-sm">{sale.invoiceNumber}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.customerName}</div>
                              <div className="text-sm text-muted-foreground">{sale.customerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${sale.total.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(sale.paymentMethod)}</TableCell>
                          <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(sale.createdAt)}</div>
                            <div className="text-xs text-muted-foreground">by {sale.createdBy}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/sales/${sale.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
