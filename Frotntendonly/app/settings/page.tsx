"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Upload, Database, FileText, Package, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExportProducts = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to export data')
        return
      }
      
      // First verify token is valid
      const authCheck = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!authCheck.ok) {
        alert('Session expired. Please log in again.')
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      
      const response = await fetch('/api/backup/export/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Products exported successfully!')
      } else {
        const errorText = await response.text()
        console.error('Export error:', errorText)
        alert(`Export failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportBackup = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to export data')
        return
      }
      
      const response = await fetch('/api/backup/export/full', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Backup created successfully!')
      } else {
        const error = await response.json()
        alert(`Backup failed: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Backup failed:', error)
      alert('Backup failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to import data')
        return
      }
      
      const response = await fetch('/api/backup/import/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Import completed: ${result.data.imported} products imported, ${result.data.errors || 0} errors`)
      } else {
        const error = await response.json()
        alert(`Import failed: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check your file format and try again.')
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage system settings and data</p>
          </div>

          {/* Data Export/Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export and import your inventory data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Export Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Products CSV</h4>
                          <p className="text-sm text-muted-foreground">Export all products to CSV</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleExportProducts} 
                        disabled={isExporting}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export Products'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Database className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-medium">Full Backup</h4>
                          <p className="text-sm text-muted-foreground">Complete database backup</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleExportBackup} 
                        disabled={isExporting}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Creating...' : 'Create Backup'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Import Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Import Data</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Upload className="h-8 w-8 text-orange-600" />
                      <div>
                        <h4 className="font-medium">Import Products</h4>
                        <p className="text-sm text-muted-foreground">Upload CSV file to import products</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="csv-upload">Select CSV File</Label>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleImportProducts}
                          disabled={isImporting}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>CSV should include: name, sku, category, supplier, costPrice, sellingPrice, currentStock</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Barcode Scanner
              </CardTitle>
              <CardDescription>Configure barcode scanning for products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Barcode Scanning</h4>
                    <p className="text-sm text-muted-foreground">Use camera to scan product barcodes</p>
                  </div>
                  <Button variant="outline">
                    Configure Scanner
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Barcode Scanner Integration</h5>
                      <p className="text-sm text-blue-700">
                        Connect USB barcode scanners or use camera-based scanning for quick product identification and stock updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Batch & Expiry Tracking</CardTitle>
              <CardDescription>Manage product batches and expiry dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Batch Tracking</h4>
                    <p className="text-sm text-muted-foreground">Track product batches with expiry dates</p>
                  </div>
                  <Button variant="outline">
                    Enable Tracking
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Expiry Alerts</h5>
                    <p className="text-sm text-muted-foreground mb-3">Get notified before products expire</p>
                    <Input placeholder="Days before expiry (e.g., 30)" />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Batch Format</h5>
                    <p className="text-sm text-muted-foreground mb-3">Configure batch number format</p>
                    <Input placeholder="e.g., BATCH-YYYYMMDD-001" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}