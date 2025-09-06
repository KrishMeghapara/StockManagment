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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, Save, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Product {
  id: string
  name: string
  sku: string
  currentStock: number
  minStock: number
  lastUnitCost?: number
}

interface Supplier {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface PurchaseItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  total: number
}

interface PurchaseForm {
  supplier: string
  items: PurchaseItem[]
  subtotal: number
  taxRate: number
  tax: number
  shipping: number
  total: number
  expectedDelivery: string
  notes: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedProduct = searchParams.get("product")

  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState<PurchaseForm>({
    supplier: "",
    items: [],
    subtotal: 0,
    taxRate: 10,
    tax: 0,
    shipping: 0,
    total: 0,
    expectedDelivery: "",
    notes: "",
  })
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { 'Authorization': `Bearer ${token}` }
        
        const [productsRes, suppliersRes] = await Promise.all([
          fetch('/api/products', { headers }),
          fetch('/api/suppliers', { headers })
        ])
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          const dbProducts = productsData.data?.products || []
          const formattedProducts: Product[] = dbProducts.map((p: any) => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            currentStock: p.stock || 0,
            minStock: p.minStockLevel || 10,
            lastUnitCost: p.price || 0
          }))
          setProducts(formattedProducts)
          
          // Pre-select product if coming from low stock alert
          if (preSelectedProduct) {
            setSelectedProduct(preSelectedProduct)
            const product = formattedProducts.find((p) => p.id === preSelectedProduct)
            if (product && product.lastUnitCost) {
              setUnitCost(product.lastUnitCost.toString())
              setQuantity(Math.max(product.minStock - product.currentStock, 1))
            }
          }
        }
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json()
          const dbSuppliers = suppliersData.data?.suppliers || []
          const formattedSuppliers: Supplier[] = dbSuppliers.map((s: any) => ({
            id: s._id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            address: s.address
          }))
          setSuppliers(formattedSuppliers)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [preSelectedProduct])

  useEffect(() => {
    // Recalculate totals when items, tax rate, or shipping changes
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
    const tax = (subtotal * formData.taxRate) / 100
    const total = subtotal + tax + formData.shipping

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax,
      total: Math.max(0, total),
    }))
  }, [formData.items, formData.taxRate, formData.shipping])

  const addItem = () => {
    if (!selectedProduct || quantity <= 0 || !unitCost || Number.parseFloat(unitCost) <= 0) {
      setErrors({ item: "Please select a product, enter valid quantity and unit cost" })
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const cost = Number.parseFloat(unitCost)

    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex((item) => item.productId === selectedProduct)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        unitCost: cost,
        total: newQuantity * cost,
      }

      setFormData((prev) => ({ ...prev, items: updatedItems }))
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        unitCost: cost,
        total: quantity * cost,
      }

      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }))
    }

    setSelectedProduct("")
    setQuantity(1)
    setUnitCost("")
    setErrors({})
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return

    const updatedItems = [...formData.items]
    const item = updatedItems[index]
    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      total: newQuantity * item.unitCost,
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const updateItemCost = (index: number, newCost: number) => {
    if (newCost <= 0) return

    const updatedItems = [...formData.items]
    const item = updatedItems[index]
    updatedItems[index] = {
      ...item,
      unitCost: newCost,
      total: item.quantity * newCost,
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplier) newErrors.supplier = "Supplier is required"
    if (formData.items.length === 0) newErrors.items = "At least one item is required"
    if (!formData.expectedDelivery) newErrors.expectedDelivery = "Expected delivery date is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setSuccess("")

    try {
      const token = localStorage.getItem('token')
      const purchaseData = {
        supplier: formData.supplier,
        items: formData.items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost
        })),
        expectedDeliveryDate: formData.expectedDelivery,
        taxAmount: formData.tax,
        discountAmount: 0,
        notes: formData.notes
      }
      
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess("Purchase order created successfully!")
        setTimeout(() => {
          router.push("/purchases")
        }, 2000)
      } else {
        setErrors({ submit: result.message || 'Failed to create purchase order' })
      }
    } catch (error) {
      console.error("Failed to create purchase order:", error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId)
    const product = products.find((p) => p.id === productId)
    if (product && product.lastUnitCost) {
      setUnitCost(product.lastUnitCost.toString())
    }
  }

  const getRecommendedQuantity = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return 0
    return Math.max(product.minStock - product.currentStock, 0)
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/purchases" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Purchases
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Purchase Order</h1>
              <p className="text-muted-foreground">Create a new purchase order for inventory restocking</p>
            </div>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <ShoppingBag className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Purchase Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Information</CardTitle>
                  <CardDescription>Select the supplier for this purchase order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select
                      value={formData.supplier}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier: value }))}
                    >
                      <SelectTrigger className={errors.supplier ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex flex-col">
                              <span>{supplier.name}</span>
                              <span className="text-sm text-muted-foreground">{supplier.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.supplier && <p className="text-sm text-destructive">{errors.supplier}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery">Expected Delivery Date *</Label>
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={formData.expectedDelivery}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                      className={errors.expectedDelivery ? "border-destructive" : ""}
                    />
                    {errors.expectedDelivery && <p className="text-sm text-destructive">{errors.expectedDelivery}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Add Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Items</CardTitle>
                  <CardDescription>Select products to include in this purchase order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Select value={selectedProduct} onValueChange={handleProductSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex flex-col">
                                <span>{product.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Stock: {product.currentStock} | Min: {product.minStock}
                                  {product.currentStock <= product.minStock && (
                                    <span className="text-red-600 ml-2">Low Stock!</span>
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                      />
                      {selectedProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: {getRecommendedQuantity(selectedProduct)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={addItem} disabled={!selectedProduct} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  {errors.item && <p className="text-sm text-destructive">{errors.item}</p>}
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Order Items</CardTitle>
                  <CardDescription>Items in this purchase order</CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(index, Number.parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.unitCost}
                                  onChange={(e) => updateItemCost(index, Number.parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell className="font-medium">${item.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {errors.items && <p className="text-sm text-destructive mt-2">{errors.items}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Purchase Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Summary</CardTitle>
                  <CardDescription>Review totals and additional costs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${formData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>${formData.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping:</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shipping}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, shipping: Number.parseFloat(e.target.value) || 0 }))
                        }
                        className="w-24 text-right"
                      />
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${formData.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes for this purchase order..."
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleSubmit} className="w-full" disabled={isLoading || formData.items.length === 0}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Creating Purchase Order...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Purchase Order
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/purchases">Cancel</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
