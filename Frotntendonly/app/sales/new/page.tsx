"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  sku: string
  sellingPrice: number
  currentStock: number
}

interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface SaleForm {
  customerName: string
  customerEmail: string
  customerPhone: string
  items: SaleItem[]
  subtotal: number
  taxRate: number
  tax: number
  discount: number
  total: number
  paymentMethod: "cash" | "card" | "bank_transfer"
  notes: string
}

export default function NewSalePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState<SaleForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    items: [],
    subtotal: 0,
    taxRate: 10,
    tax: 0,
    discount: 0,
    total: 0,
    paymentMethod: "cash",
    notes: "",
  })
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    // Simulate API call to fetch products
    setTimeout(() => {
      const mockProducts: Product[] = [
        { id: "1", name: "Wireless Headphones", sku: "WH-001", sellingPrice: 299.99, currentStock: 5 },
        { id: "2", name: "Office Chair", sku: "OC-002", sellingPrice: 249.99, currentStock: 2 },
        { id: "3", name: "Laptop Stand", sku: "LS-003", sellingPrice: 89.99, currentStock: 8 },
        { id: "4", name: "USB Cable", sku: "UC-004", sellingPrice: 19.99, currentStock: 12 },
        { id: "5", name: "Desk Lamp", sku: "DL-005", sellingPrice: 79.99, currentStock: 25 },
      ]
      setProducts(mockProducts)
    }, 500)
  }, [])

  useEffect(() => {
    // Recalculate totals when items, tax rate, or discount changes
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
    const tax = (subtotal * formData.taxRate) / 100
    const total = subtotal + tax - formData.discount

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax,
      total: Math.max(0, total),
    }))
  }, [formData.items, formData.taxRate, formData.discount])

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    if (quantity > product.currentStock) {
      setErrors({ quantity: `Only ${product.currentStock} units available` })
      return
    }

    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex((item) => item.productId === selectedProduct)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity

      if (newQuantity > product.currentStock) {
        setErrors({ quantity: `Only ${product.currentStock} units available` })
        return
      }

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * existingItem.unitPrice,
      }

      setFormData((prev) => ({ ...prev, items: updatedItems }))
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        unitPrice: product.sellingPrice,
        total: quantity * product.sellingPrice,
      }

      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }))
    }

    setSelectedProduct("")
    setQuantity(1)
    setErrors({})
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return

    const item = formData.items[index]
    const product = products.find((p) => p.id === item.productId)

    if (!product || newQuantity > product.currentStock) {
      setErrors({ [`item_${index}`]: `Only ${product?.currentStock || 0} units available` })
      return
    }

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      total: newQuantity * item.unitPrice,
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }))
    setErrors((prev) => ({ ...prev, [`item_${index}`]: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) newErrors.customerName = "Customer name is required"
    if (!formData.customerEmail.trim()) newErrors.customerEmail = "Customer email is required"
    if (formData.items.length === 0) newErrors.items = "At least one item is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setSuccess("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess("Sale completed successfully!")

      // Redirect to sales list after success
      setTimeout(() => {
        router.push("/sales")
      }, 2000)
    } catch (error) {
      console.error("Failed to create sale:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sales" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sales
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Sale</h1>
              <p className="text-muted-foreground">Create a new sales transaction</p>
            </div>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <ShoppingCart className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Enter customer details for the sale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={formData.customerName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                        className={errors.customerName ? "border-destructive" : ""}
                      />
                      {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                        className={errors.customerEmail ? "border-destructive" : ""}
                      />
                      {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone (Optional)</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Enter phone number"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Add Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Items</CardTitle>
                  <CardDescription>Select products to add to the sale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} disabled={product.currentStock === 0}>
                              <div className="flex justify-between items-center w-full">
                                <span>{product.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ${product.sellingPrice.toFixed(2)} ({product.currentStock} in stock)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        className={errors.quantity ? "border-destructive" : ""}
                      />
                    </div>
                    <Button onClick={addItem} disabled={!selectedProduct}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Sale Items</CardTitle>
                  <CardDescription>Items in this sale</CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(index, Number.parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                                {errors[`item_${index}`] && (
                                  <p className="text-xs text-destructive mt-1">{errors[`item_${index}`]}</p>
                                )}
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

            {/* Sale Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sale Summary</CardTitle>
                  <CardDescription>Review totals and payment details</CardDescription>
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
                      <span>Discount:</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, discount: Number.parseFloat(e.target.value) || 0 }))
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
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: "cash" | "card" | "bank_transfer") =>
                        setFormData((prev) => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Add any notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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
                      Processing Sale...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Complete Sale
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/sales">Cancel</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
