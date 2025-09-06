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
import { Plus, Search, Eye, Truck, DollarSign, ShoppingBag, Package } from "lucide-react"
import Link from "next/link"

interface Purchase {
  id: string
  purchaseOrderNumber: string
  supplier: string
  supplierEmail: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitCost: number
    total: number
  }>
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: "pending" | "ordered" | "received" | "cancelled"
  expectedDelivery?: string
  actualDelivery?: string
  createdAt: string
  createdBy: string
  notes?: string
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/purchases')
        if (response.ok) {
          const data = await response.json()
          const backendPurchases = data.data?.purchases || []
          
          const formattedPurchases: Purchase[] = backendPurchases.map((p: any) => ({
            id: p._id,
            purchaseOrderNumber: p.purchaseOrderNumber || `PO-${p._id.slice(-6)}`,
            supplier: p.supplier?.name || 'Unknown Supplier',
            supplierEmail: p.supplier?.email || '',
            items: p.items?.map((item: any) => ({
              productId: item.product?._id || item.productId,
              productName: item.product?.name || item.productName || 'Unknown Product',
              quantity: item.quantity || 0,
              unitCost: item.unitCost || 0,
              total: (item.quantity || 0) * (item.unitCost || 0)
            })) || [],
            subtotal: p.subtotal || 0,
            tax: p.tax || 0,
            shipping: p.shipping || 0,
            total: p.total || 0,
            status: p.status || 'pending',
            expectedDelivery: p.expectedDelivery,
            actualDelivery: p.actualDelivery,
            createdAt: p.createdAt,
            createdBy: p.createdBy?.name || 'Unknown',
            notes: p.notes
          }))
          
          setPurchases(formattedPurchases)
          setFilteredPurchases(formattedPurchases)
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPurchases()
  }, [])

  useEffect(() => {
    let filtered = purchases

    if (searchTerm) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    if (supplierFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.supplier === supplierFilter)
    }

    setFilteredPurchases(filtered)
  }, [purchases, searchTerm, statusFilter, supplierFilter])

  const getStatusBadge = (status: Purchase["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "ordered":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Ordered
          </Badge>
        )
      case "received":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Received
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const suppliers = [...new Set(purchases.map((p) => p.supplier))].filter(Boolean)

  // Calculate summary stats
  const receivedPurchases = purchases.filter((p) => p.status === "received")
  const totalSpent = receivedPurchases.reduce((sum, purchase) => sum + purchase.total, 0)
  const totalOrders = purchases.length
  const pendingOrders = purchases.filter((p) => p.status === "pending" || p.status === "ordered").length

  return (
    <ProtectedRoute requiredRole="manager">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
              <p className="text-muted-foreground">Manage purchase orders and supplier relationships</p>
            </div>
            <Button asChild>
              <Link href="/purchases/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">${totalSpent.toFixed(2)}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold text-foreground">{pendingOrders}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                    <p className="text-2xl font-bold text-foreground">{suppliers.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Truck className="h-6 w-6 text-purple-600" />
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
                      placeholder="Search by PO number, supplier, or product..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                {filteredPurchases.length} of {purchases.length} purchase orders
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
                        <TableHead>Purchase Order</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <div className="font-mono text-sm">{purchase.purchaseOrderNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {formatDate(purchase.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{purchase.supplier}</div>
                              <div className="text-sm text-muted-foreground">{purchase.supplierEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {purchase.items.length} item{purchase.items.length !== 1 ? "s" : ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units total
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${purchase.total.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                          <TableCell>
                            {purchase.expectedDelivery ? (
                              <div className="text-sm">
                                {formatDate(purchase.expectedDelivery)}
                                {purchase.actualDelivery && (
                                  <div className="text-xs text-green-600">
                                    Delivered {formatDate(purchase.actualDelivery)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/purchases/${purchase.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
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
