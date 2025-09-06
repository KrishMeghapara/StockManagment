"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ArrowLeft, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface LowStockProduct {
  id: string
  name: string
  sku: string
  category: string
  supplier: string
  currentStock: number
  minStock: number
  maxStock: number
  sellingPrice: number
  status: "out_of_stock" | "low_stock"
  daysOutOfStock?: number
}

export default function LowStockPage() {
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProducts: LowStockProduct[] = [
        {
          id: "1",
          name: "Wireless Headphones",
          sku: "WH-001",
          category: "Electronics",
          supplier: "TechCorp",
          currentStock: 0,
          minStock: 20,
          maxStock: 100,
          sellingPrice: 299.99,
          status: "out_of_stock",
          daysOutOfStock: 3,
        },
        {
          id: "2",
          name: "Office Chair",
          sku: "OC-002",
          category: "Furniture",
          supplier: "FurniSupply",
          currentStock: 2,
          minStock: 10,
          maxStock: 50,
          sellingPrice: 249.99,
          status: "low_stock",
        },
        {
          id: "3",
          name: "Laptop Stand",
          sku: "LS-003",
          category: "Accessories",
          supplier: "AccessoryHub",
          currentStock: 8,
          minStock: 15,
          maxStock: 75,
          sellingPrice: 89.99,
          status: "low_stock",
        },
        {
          id: "4",
          name: "USB Cable",
          sku: "UC-004",
          category: "Electronics",
          supplier: "TechCorp",
          currentStock: 12,
          minStock: 50,
          maxStock: 200,
          sellingPrice: 19.99,
          status: "low_stock",
        },
        {
          id: "5",
          name: "Desk Organizer",
          sku: "DO-005",
          category: "Office Supplies",
          supplier: "OfficeMax",
          currentStock: 0,
          minStock: 25,
          maxStock: 100,
          sellingPrice: 34.99,
          status: "out_of_stock",
          daysOutOfStock: 1,
        },
      ]
      setProducts(mockProducts)
      setIsLoading(false)
    }, 1000)
  }, [])

  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length
  const lowStockCount = products.filter((p) => p.status === "low_stock").length

  const getStatusBadge = (product: LowStockProduct) => {
    if (product.status === "out_of_stock") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    }
  }

  const getRecommendedOrder = (product: LowStockProduct) => {
    return product.maxStock - product.currentStock
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Low Stock Alerts</h1>
              <p className="text-muted-foreground">Products that need immediate attention</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{products.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products Requiring Attention</CardTitle>
              <CardDescription>Items that are out of stock or below minimum stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/6"></div>
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
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recommended Order</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow
                          key={product.id}
                          className={product.status === "out_of_stock" ? "bg-red-50" : "bg-yellow-50"}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.sku} • {product.supplier}
                              </div>
                              {product.daysOutOfStock && (
                                <div className="text-xs text-red-600 mt-1">
                                  Out of stock for {product.daysOutOfStock} days
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.currentStock}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground">{product.minStock}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(product)}</TableCell>
                          <TableCell>
                            <div className="font-medium text-primary">{getRecommendedOrder(product)} units</div>
                            <div className="text-xs text-muted-foreground">
                              Est. ${(getRecommendedOrder(product) * product.sellingPrice * 0.6).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" asChild>
                                <Link href={`/purchases/new?product=${product.id}`}>Order Now</Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/products/${product.id}`}>View</Link>
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
