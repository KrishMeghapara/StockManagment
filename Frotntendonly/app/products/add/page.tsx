"use client"

import type React from "react"

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
import { ArrowLeft, Save, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProductForm {
  name: string
  sku: string
  description: string
  category: string
  supplier: string
  unitPrice: string
  sellingPrice: string
  currentStock: string
  minStock: string
  maxStock: string
  status: "active" | "inactive"
}

export default function AddProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    sku: "",
    description: "",
    category: "",
    supplier: "",
    unitPrice: "",
    sellingPrice: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    status: "active",
  })
  const [errors, setErrors] = useState<Partial<ProductForm>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = {
          'Authorization': `Bearer ${token}`
        }
        
        const [categoriesRes, suppliersRes] = await Promise.all([
          fetch('/api/categories', { headers }),
          fetch('/api/suppliers', { headers })
        ])
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          console.log('Categories data:', categoriesData)
          setCategories(categoriesData.data?.categories || [])
        } else {
          console.error('Categories fetch failed:', categoriesRes.status)
        }
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json()
          console.log('Suppliers data:', suppliersData)
          setSuppliers(suppliersData.data?.suppliers || [])
        } else {
          console.error('Suppliers fetch failed:', suppliersRes.status)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    fetchData()
  }, [])

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    console.log('Changing field:', field, 'to value:', value)
    if (value && value !== 'undefined') {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductForm> = {}

    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (!formData.sku.trim()) newErrors.sku = "SKU is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.supplier) newErrors.supplier = "Supplier is required"
    if (!formData.unitPrice || Number.parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = "Valid unit price is required"
    }
    if (!formData.sellingPrice || Number.parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = "Valid selling price is required"
    }
    if (!formData.currentStock || Number.parseInt(formData.currentStock) < 0) {
      newErrors.currentStock = "Valid current stock is required"
    }
    if (!formData.minStock || Number.parseInt(formData.minStock) < 0) {
      newErrors.minStock = "Valid minimum stock is required"
    }
    if (!formData.maxStock || Number.parseInt(formData.maxStock) <= 0) {
      newErrors.maxStock = "Valid maximum stock is required"
    }

    // Check if selling price is higher than unit price
    if (formData.unitPrice && formData.sellingPrice) {
      const unitPrice = Number.parseFloat(formData.unitPrice)
      const sellingPrice = Number.parseFloat(formData.sellingPrice)
      if (sellingPrice <= unitPrice) {
        newErrors.sellingPrice = "Selling price must be higher than unit price"
      }
    }

    // Check if max stock is higher than min stock
    if (formData.minStock && formData.maxStock) {
      const minStock = Number.parseInt(formData.minStock)
      const maxStock = Number.parseInt(formData.maxStock)
      if (maxStock <= minStock) {
        newErrors.maxStock = "Maximum stock must be higher than minimum stock"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setSuccess("")

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category: formData.category,
          supplier: formData.supplier,
          costPrice: parseFloat(formData.unitPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          currentStock: parseInt(formData.currentStock),
          minStockLevel: parseInt(formData.minStock),
          maxStockLevel: parseInt(formData.maxStock),
          unit: 'piece',
          isActive: formData.status === 'active'
        })
      })
      
      if (response.ok) {
        setSuccess("Product added successfully!")
        
        // Reset form
        setFormData({
          name: "",
          sku: "",
          description: "",
          category: "",
          supplier: "",
          unitPrice: "",
          sellingPrice: "",
          currentStock: "",
          minStock: "",
          maxStock: "",
          status: "active",
        })
        
        // Redirect after success
        setTimeout(() => {
          router.push("/products")
        }, 2000)
      } else {
        const error = await response.json()
        console.error('Product creation error:', error)
        console.error('Validation errors:', error.errors)
        const errorMsg = error.errors ? 
          error.errors.map((e: any) => `${e.path}: ${e.msg || e.message}`).join(', ') : 
          error.message
        alert(`Failed to add product: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Failed to add product:", error)
      alert('Failed to add product. Please try again.')
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
              <Link href="/products" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
              <p className="text-muted-foreground">Create a new product in your inventory</p>
            </div>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Package className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Enter the basic details of the product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter product name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          placeholder="Enter SKU"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                          className={errors.sku ? "border-destructive" : ""}
                        />
                        {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter product description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category || ""}
                          onValueChange={(value) => {
                            console.log('Category selected:', value)
                            handleInputChange("category", value)
                          }}
                        >
                          <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingData ? (
                              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                            ) : categories.length === 0 ? (
                              <>
                                <SelectItem value="no-categories" disabled>No categories found</SelectItem>
                                <div className="p-2">
                                  <Button 
                                    size="sm" 
                                    className="w-full" 
                                    onClick={async () => {
                                      const token = localStorage.getItem('token')
                                      const response = await fetch('/api/categories/seed', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      })
                                      if (response.ok) {
                                        window.location.reload()
                                      }
                                    }}
                                  >
                                    Add Default Categories
                                  </Button>
                                </div>
                              </>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.id || category._id} value={category.id || category._id}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier *</Label>
                        <Select
                          value={formData.supplier || ""}
                          onValueChange={(value) => {
                            console.log('Supplier selected:', value)
                            handleInputChange("supplier", value)
                          }}
                        >
                          <SelectTrigger className={errors.supplier ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingData ? (
                              <SelectItem value="loading" disabled>Loading suppliers...</SelectItem>
                            ) : suppliers.length === 0 ? (
                              <SelectItem value="no-suppliers" disabled>No suppliers found</SelectItem>
                            ) : (
                              suppliers.map((supplier) => (
                                <SelectItem key={supplier.id || supplier._id} value={supplier.id || supplier._id}>
                                  {supplier.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.supplier && <p className="text-sm text-destructive">{errors.supplier}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                    <CardDescription>Set the pricing information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.unitPrice}
                        onChange={(e) => handleInputChange("unitPrice", e.target.value)}
                        className={errors.unitPrice ? "border-destructive" : ""}
                      />
                      {errors.unitPrice && <p className="text-sm text-destructive">{errors.unitPrice}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Selling Price *</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sellingPrice}
                        onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                        className={errors.sellingPrice ? "border-destructive" : ""}
                      />
                      {errors.sellingPrice && <p className="text-sm text-destructive">{errors.sellingPrice}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Information</CardTitle>
                    <CardDescription>Set the stock levels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Current Stock *</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        placeholder="0"
                        value={formData.currentStock}
                        onChange={(e) => handleInputChange("currentStock", e.target.value)}
                        className={errors.currentStock ? "border-destructive" : ""}
                      />
                      {errors.currentStock && <p className="text-sm text-destructive">{errors.currentStock}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimum Stock *</Label>
                      <Input
                        id="minStock"
                        type="number"
                        placeholder="0"
                        value={formData.minStock}
                        onChange={(e) => handleInputChange("minStock", e.target.value)}
                        className={errors.minStock ? "border-destructive" : ""}
                      />
                      {errors.minStock && <p className="text-sm text-destructive">{errors.minStock}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Maximum Stock *</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        placeholder="0"
                        value={formData.maxStock}
                        onChange={(e) => handleInputChange("maxStock", e.target.value)}
                        className={errors.maxStock ? "border-destructive" : ""}
                      />
                      {errors.maxStock && <p className="text-sm text-destructive">{errors.maxStock}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status || "active"}
                        onValueChange={(value: "active" | "inactive") => handleInputChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Adding Product...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
