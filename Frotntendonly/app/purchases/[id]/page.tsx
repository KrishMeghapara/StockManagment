"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, Printer, Mail, Package, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Purchase {
  id: string
  purchaseOrderNumber: string
  supplier: string
  supplierEmail: string
  supplierPhone?: string
  items: Array<{
    productId: string
    productName: string
    sku: string
    quantity: number
    unitCost: number
    total: number
  }>
  subtotal: number
  tax: number
  taxRate: number
  shipping: number
  total: number
  status: "pending" | "ordered" | "received" | "cancelled"
  expectedDelivery?: string
  actualDelivery?: string
  notes?: string
  createdAt: string
  createdBy: string
}

export default function PurchaseDetailsPage() {
  const params = useParams()
  const purchaseId = params.id as string

  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Simulate API call to fetch purchase details
    setTimeout(() => {
      const mockPurchase: Purchase = {
        id: purchaseId,
        purchaseOrderNumber: "PO-2024-001",
        supplier: "TechCorp",
        supplierEmail: "orders@techcorp.com",
        supplierPhone: "+1 (555) 123-4567",
        items: [
          {
            productId: "1",
            productName: "Wireless Headphones",
            sku: "WH-001",
            quantity: 50,
            unitCost: 150.0,
            total: 7500.0,
          },
          {
            productId: "4",
            productName: "USB Cable",
            sku: "UC-004",
            quantity: 100,
            unitCost: 5.0,
            total: 500.0,
          },
        ],
        subtotal: 8000.0,
        tax: 800.0,
        taxRate: 10,
        shipping: 150.0,
        total: 8950.0,
        status: "ordered",
        expectedDelivery: "2024-01-20",
        notes: "Bulk order for Q1 inventory restocking",
        createdAt: "2024-01-10T09:00:00Z",
        createdBy: "Jane Smith",
      }
      setPurchase(mockPurchase)
      setIsLoading(false)
    }, 1000)
  }, [purchaseId])

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusUpdate = async (newStatus: Purchase["status"]) => {
    if (!purchase) return

    setIsUpdating(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPurchase((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              actualDelivery: newStatus === "received" ? new Date().toISOString().split("T")[0] : prev.actualDelivery,
            }
          : null,
      )
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    console.log("Downloading PDF for PO:", purchase?.purchaseOrderNumber)
  }

  const handleEmailPO = () => {
    console.log("Emailing PO to:", purchase?.supplierEmail)
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="manager">
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

  if (!purchase) {
    return (
      <ProtectedRoute requiredRole="manager">
        <DashboardLayout>
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Purchase Order Not Found</h2>
            <p className="text-muted-foreground mb-4">The purchase order you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/purchases">Back to Purchases</Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/purchases" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Purchases
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{purchase.purchaseOrderNumber}</h1>
                <p className="text-muted-foreground">Purchase Order Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(purchase.status)}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmailPO}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          {/* Status Update Actions */}
          {purchase.status !== "received" && purchase.status !== "cancelled" && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Update the status of this purchase order:</span>
                <div className="flex gap-2">
                  {purchase.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate("ordered")}
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Mark as Ordered
                    </Button>
                  )}
                  {purchase.status === "ordered" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate("received")}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Received
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel Order
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Purchase Order Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">PURCHASE ORDER</CardTitle>
                      <CardDescription className="text-lg">{purchase.purchaseOrderNumber}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-medium">{formatDate(purchase.createdAt)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Supplier & Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Supplier:</h3>
                      <div className="space-y-1">
                        <div className="font-medium">{purchase.supplier}</div>
                        <div className="text-sm text-muted-foreground">{purchase.supplierEmail}</div>
                        {purchase.supplierPhone && (
                          <div className="text-sm text-muted-foreground">{purchase.supplierPhone}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Ship To:</h3>
                      <div className="space-y-1">
                        <div className="font-medium">Stock Manager Warehouse</div>
                        <div className="text-sm text-muted-foreground">123 Warehouse Street</div>
                        <div className="text-sm text-muted-foreground">City, State 12345</div>
                        <div className="text-sm text-muted-foreground">warehouse@stockmanager.com</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Items Table */}
                  <div>
                    <h3 className="font-semibold mb-4">Items Ordered</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchase.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${purchase.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({purchase.taxRate}%):</span>
                        <span>${purchase.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${purchase.shipping.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${purchase.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {purchase.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Purchase Information */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                  <CardDescription>Order details and delivery status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created By:</span>
                      <span className="text-sm">{purchase.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date Created:</span>
                      <span className="text-sm">{formatDate(purchase.createdAt)}</span>
                    </div>
                    {purchase.expectedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expected Delivery:</span>
                        <span className="text-sm">{new Date(purchase.expectedDelivery).toLocaleDateString()}</span>
                      </div>
                    )}
                    {purchase.actualDelivery && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Actual Delivery:</span>
                        <span className="text-sm text-green-600">
                          {new Date(purchase.actualDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Order Summary</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Items Ordered:</span>
                      <span className="text-sm font-medium">
                        {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Product Types:</span>
                      <span className="text-sm font-medium">{purchase.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Item Cost:</span>
                      <span className="text-sm font-medium">
                        ${(purchase.subtotal / purchase.items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)}
                      </span>
                    </div>
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
