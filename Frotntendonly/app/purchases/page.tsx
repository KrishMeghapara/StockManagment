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
    // Simulate API call
    setTimeout(() => {
      const mockPurchases: Purchase[] = [
        {
          id: "1",
          purchaseOrderNumber: "PO-2024-001",
          supplier: "TechCorp",
          supplierEmail: "orders@techcorp.com",
          items: [
            {
              productId: "1",
              productName: "Wireless Headphones",
              quantity: 50,
              unitCost: 150.0,
              total: 7500.0,
            },
            {
              productId: "4",
              productName: "USB Cable",
              quantity: 100,
              unitCost: 5.0,
              total: 500.0,
            },
          ],
          subtotal: 8000.0,
          tax: 800.0,
          shipping: 150.0,
          total: 8950.0,
          status: "received",
          expectedDelivery: "2024-01-20",
          actualDelivery: "2024-01-18",
          createdAt: "2024-01-10T09:00:00Z",
          createdBy: "Jane Smith",
          notes: "Bulk order for Q1 inventory",
        },
        {
          id: "2",
          purchaseOrderNumber: "PO-2024-002",
          supplier: "FurniSupply",
          supplierEmail: "sales@furnisupply.com",
          items: [
            {
              productId: "2",
              productName: "Office Chair",
              quantity: 25,
              unitCost: 120.0,
              total: 3000.0,
            },
          ],
          subtotal: 3000.0,
          tax: 300.0,
          shipping: 200.0,
          total: 3500.0,
          status: "ordered",
          expectedDelivery: "2024-01-25",
          createdAt: "2024-01-12T14:30:00Z",
          createdBy: "Mike Johnson",
        },
        {
          id: "3",
          purchaseOrderNumber: "PO-2024-003",
          supplier: "AccessoryHub",
          supplierEmail: "orders@accessoryhub.com",
          items: [
            {
              productId: "3",
              productName: "Laptop Stand",
              quantity: 30,
              unitCost: 25.0,
              total: 750.0,
            },
          ],
          subtotal: 750.0,
          tax: 75.0,
          shipping: 50.0,
          total: 875.0,
          status: "pending",
          expectedDelivery: "2024-01-30",
          createdAt: "2024-01-14T11:15:00Z",
          createdBy: "Sarah Wilson",
        },
        {
          id: "4",
          purchaseOrderNumber: "PO-2024-004",
          supplier: "LightingCo",
          supplierEmail: "orders@lightingco.com",
          items: [
            {
              productId: "5",
              productName: "Desk Lamp",
              quantity: 40,
              unitCost: 30.0,
              total: 1200.0,
            },
          ],
          subtotal: 1200.0,
          tax: 120.0,
          shipping: 80.0,
          total: 1400.0,
          status: "cancelled",
          createdAt: "2024-01-08T16:45:00Z",
          createdBy: "John Doe",
          notes: "Cancelled due to supplier issues",
        },
      ]
      setPurchases(mockPurchases)
      setFilteredPurchases(mockPurchases)
      setIsLoading(false)
    }, 1000)
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

  const suppliers = [...new Set(purchases.map((p) => p.supplier))]

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
