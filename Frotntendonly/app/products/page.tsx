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
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  supplier: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  sellingPrice: number
  status: "active" | "inactive"
  lastUpdated: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          const backendProducts = data.data?.products || []
          
          const formattedProducts: Product[] = backendProducts.map((p: any) => ({
            id: p._id,
            name: p.name || 'Unnamed Product',
            sku: p.sku || 'N/A',
            category: p.category?.name || 'Uncategorized',
            supplier: p.supplier?.name || 'Unknown Supplier',
            currentStock: p.currentStock || 0,
            minStock: p.minStockLevel || 10,
            maxStock: p.maxStockLevel || 100,
            unitPrice: p.costPrice || 0,
            sellingPrice: p.sellingPrice || 0,
            status: p.isActive !== false ? 'active' : 'inactive',
            lastUpdated: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }))
          
          setProducts(formattedProducts)
          setFilteredProducts(formattedProducts)
        } else {
          console.error('Failed to fetch products:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter, statusFilter])

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (product.currentStock <= product.minStock) {
      return { label: "Low Stock", variant: "secondary" as const, icon: AlertTriangle }
    } else {
      return { label: "In Stock", variant: "default" as const, icon: Package }
    }
  }

  const categories = [...new Set(products.map((p) => p.category))]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Products</h1>
              <p className="text-muted-foreground">Manage your inventory and product catalog</p>
            </div>
            <Button asChild>
              <Link href="/products/add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products, SKU, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(Boolean).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>
                {filteredProducts.length} of {products.length} products
              </CardDescription>
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
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product)
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{product.supplier}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <stockStatus.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{product.currentStock}</div>
                                  <div className="text-xs text-muted-foreground">Min: {product.minStock}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">${product.sellingPrice.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Cost: ${product.unitPrice.toFixed(2)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/products/${product.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
