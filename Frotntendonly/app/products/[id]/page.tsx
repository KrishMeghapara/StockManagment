"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Package, History, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  sku: string
  description: string
  category: string
  supplier: string
  unitPrice: number
  sellingPrice: number
  currentStock: number
  minStock: number
  maxStock: number
  status: "active" | "inactive"
  lastUpdated: string
  createdAt: string
}

interface StockHistory {
  id: string
  type: "adjustment" | "sale" | "purchase"
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  timestamp: string
  user: string
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Simulate API call to fetch product details
    setTimeout(() => {
      const mockProduct: Product = {
        id: productId,
        name: "Wireless Headphones",
        sku: "WH-001",
        description: "High-quality wireless headphones with noise cancellation and long battery life.",
        category: "Electronics",
        supplier: "TechCorp",
        unitPrice: 150.0,
        sellingPrice: 299.99,
        currentStock: 5,
        minStock: 20,
        maxStock: 100,
        status: "active",
        lastUpdated: "2024-01-15",
        createdAt: "2024-01-01",
      }

      const mockHistory: StockHistory[] = [
        {
          id: "1",
          type: "sale",
          quantity: -2,
          previousStock: 7,
          newStock: 5,
          reason: "Sale transaction #12345",
          timestamp: "2024-01-15 14:30",
          user: "John Doe",
        },
        {
          id: "2",
          type: "purchase",
          quantity: 10,
          previousStock: 15,
          newStock: 25,
          reason: "Purchase order #PO-001",
          timestamp: "2024-01-10 09:15",
          user: "Jane Smith",
        },
        {
          id: "3",
          type: "adjustment",
          quantity: -3,
          previousStock: 18,
          newStock: 15,
          reason: "Damaged items removed",
          timestamp: "2024-01-08 16:45",
          user: "Mike Johnson",
        },
      ]

      setProduct(mockProduct)
      setStockHistory(mockHistory)
      setIsLoading(false)
    }, 1000)
  }, [productId])

  const handleSave = async () => {
    if (!product) return

    setIsSaving(true)
    setSuccess("")
    setErrors({})

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("Product updated successfully!")
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update product:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getStockStatus = () => {
    if (!product) return null

    if (product.currentStock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (product.currentStock <= product.minStock) {
      return { label: "Low Stock", variant: "secondary" as const, icon: AlertTriangle }
    } else {
      return { label: "In Stock", variant: "default" as const, icon: Package }
    }
  }

  const getHistoryIcon = (type: StockHistory["type"]) => {
    switch (type) {
      case "sale":
        return "📦"
      case "purchase":
        return "📈"
      case "adjustment":
        return "⚙️"
      default:
        return "📋"
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="h-96 bg-muted rounded"></div>
                </div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const stockStatus = getStockStatus()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Products
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                <p className="text-muted-foreground">SKU: {product.sku}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stockStatus && (
                <Badge variant={stockStatus.variant} className="flex items-center gap-1">
                  <stockStatus.icon className="h-3 w-3" />
                  {stockStatus.label}
                </Badge>
              )}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Product</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Package className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>Basic details and specifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={product.name}
                        onChange={(e) => setProduct((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={product.sku}
                        onChange={(e) => setProduct((prev) => (prev ? { ...prev, sku: e.target.value } : null))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={product.description}
                      onChange={(e) => setProduct((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={product.category}
                        onValueChange={(value) => setProduct((prev) => (prev ? { ...prev, category: value } : null))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Tools">Tools</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Select
                        value={product.supplier}
                        onValueChange={(value) => setProduct((prev) => (prev ? { ...prev, supplier: value } : null))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TechCorp">TechCorp</SelectItem>
                          <SelectItem value="FurniSupply">FurniSupply</SelectItem>
                          <SelectItem value="AccessoryHub">AccessoryHub</SelectItem>
                          <SelectItem value="OfficeMax">OfficeMax</SelectItem>
                          <SelectItem value="ToolWorld">ToolWorld</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Stock</CardTitle>
                  <CardDescription>Pricing and inventory information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Pricing</h4>
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Unit Price</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          step="0.01"
                          value={product.unitPrice}
                          onChange={(e) =>
                            setProduct((prev) =>
                              prev ? { ...prev, unitPrice: Number.parseFloat(e.target.value) } : null,
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellingPrice">Selling Price</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          step="0.01"
                          value={product.sellingPrice}
                          onChange={(e) =>
                            setProduct((prev) =>
                              prev ? { ...prev, sellingPrice: Number.parseFloat(e.target.value) } : null,
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Stock Levels</h4>
                      <div className="space-y-2">
                        <Label htmlFor="currentStock">Current Stock</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={product.currentStock}
                          onChange={(e) =>
                            setProduct((prev) =>
                              prev ? { ...prev, currentStock: Number.parseInt(e.target.value) } : null,
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Minimum Stock</Label>
                        <Input
                          id="minStock"
                          type="number"
                          value={product.minStock}
                          onChange={(e) =>
                            setProduct((prev) => (prev ? { ...prev, minStock: Number.parseInt(e.target.value) } : null))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxStock">Maximum Stock</Label>
                        <Input
                          id="maxStock"
                          type="number"
                          value={product.maxStock}
                          onChange={(e) =>
                            setProduct((prev) => (prev ? { ...prev, maxStock: Number.parseInt(e.target.value) } : null))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock History */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Stock History
                  </CardTitle>
                  <CardDescription>Recent stock movements and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stockHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="text-lg">{getHistoryIcon(entry.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {entry.type}
                            </Badge>
                            <span
                              className={`text-sm font-medium ${
                                entry.quantity > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {entry.quantity > 0 ? "+" : ""}
                              {entry.quantity}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{entry.reason}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            <div>
                              {entry.previousStock} → {entry.newStock} units
                            </div>
                            <div>
                              {entry.user} • {entry.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
