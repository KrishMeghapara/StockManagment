"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer, Mail, Package } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Sale {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: Array<{
    productId: string
    productName: string
    sku: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  taxRate: number
  discount: number
  total: number
  status: "completed" | "pending" | "cancelled"
  paymentMethod: "cash" | "card" | "bank_transfer"
  notes?: string
  createdAt: string
  createdBy: string
}

export default function SaleDetailsPage() {
  const params = useParams()
  const saleId = params.id as string

  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch sale details
    setTimeout(() => {
      const mockSale: Sale = {
        id: saleId,
        invoiceNumber: "INV-2024-001",
        customerName: "John Smith",
        customerEmail: "john.smith@email.com",
        customerPhone: "+1 (555) 123-4567",
        items: [
          {
            productId: "1",
            productName: "Wireless Headphones",
            sku: "WH-001",
            quantity: 2,
            unitPrice: 299.99,
            total: 599.98,
          },
          {
            productId: "3",
            productName: "Laptop Stand",
            sku: "LS-003",
            quantity: 1,
            unitPrice: 89.99,
            total: 89.99,
          },
        ],
        subtotal: 689.97,
        tax: 69.0,
        taxRate: 10,
        discount: 0,
        total: 758.97,
        status: "completed",
        paymentMethod: "card",
        notes: "Customer requested express delivery",
        createdAt: "2024-01-15T14:30:00Z",
        createdBy: "Jane Doe",
      }
      setSale(mockSale)
      setIsLoading(false)
    }, 1000)
  }, [saleId])

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Simulate PDF download
    console.log("Downloading PDF for invoice:", sale?.invoiceNumber)
  }

  const handleEmailInvoice = () => {
    // Simulate email sending
    console.log("Emailing invoice to:", sale?.customerEmail)
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

  if (!sale) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sale Not Found</h2>
            <p className="text-muted-foreground mb-4">The sale you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/sales">Back to Sales</Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sales
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{sale.invoiceNumber}</h1>
                <p className="text-muted-foreground">Sale Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(sale.status)}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmailInvoice}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">INVOICE</CardTitle>
                      <CardDescription className="text-lg">{sale.invoiceNumber}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-medium">{formatDate(sale.createdAt)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer & Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <div className="space-y-1">
                        <div className="font-medium">{sale.customerName}</div>
                        <div className="text-sm text-muted-foreground">{sale.customerEmail}</div>
                        {sale.customerPhone && (
                          <div className="text-sm text-muted-foreground">{sale.customerPhone}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">From:</h3>
                      <div className="space-y-1">
                        <div className="font-medium">Stock Manager</div>
                        <div className="text-sm text-muted-foreground">123 Business Street</div>
                        <div className="text-sm text-muted-foreground">City, State 12345</div>
                        <div className="text-sm text-muted-foreground">contact@stockmanager.com</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Items Table */}
                  <div>
                    <h3 className="font-semibold mb-4">Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
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
                        <span>${sale.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({sale.taxRate}%):</span>
                        <span>${sale.tax.toFixed(2)}</span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-${sale.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${sale.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {sale.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <p className="text-sm text-muted-foreground">{sale.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sale Information */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Sale Information</CardTitle>
                  <CardDescription>Transaction details and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(sale.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Method:</span>
                      {getPaymentMethodBadge(sale.paymentMethod)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created By:</span>
                      <span className="text-sm">{sale.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date Created:</span>
                      <span className="text-sm">{formatDate(sale.createdAt)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Stats</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Items Sold:</span>
                      <span className="text-sm font-medium">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Product Types:</span>
                      <span className="text-sm font-medium">{sale.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Item Price:</span>
                      <span className="text-sm font-medium">
                        ${(sale.subtotal / sale.items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)}
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
