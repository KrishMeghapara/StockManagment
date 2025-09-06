"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: "active" | "inactive"
  totalProducts: number
  lastOrderDate: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/suppliers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          const backendSuppliers = data.data?.suppliers || []
          
          const formattedSuppliers: Supplier[] = backendSuppliers.map((s: any) => ({
            id: s._id,
            name: s.name || 'Unknown Supplier',
            contactPerson: s.contactPerson || 'N/A',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address?.street || s.fullAddress || '',
            status: s.isActive !== false ? 'active' : 'inactive',
            totalProducts: s.totalProducts || 0,
            lastOrderDate: s.lastOrderDate ? new Date(s.lastOrderDate).toLocaleDateString() : 'Never'
          }))
          
          setSuppliers(formattedSuppliers)
          setFilteredSuppliers(formattedSuppliers)
        } else {
          console.error('Failed to fetch suppliers:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch suppliers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSuppliers()
  }, [])

  useEffect(() => {
    let filtered = suppliers
    
    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm])

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      alert('Supplier name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to add suppliers')
        return
      }
      
      console.log('Adding supplier:', newSupplier)
      
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSupplier)
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        const addedSupplier = {
          id: data.data.supplier._id,
          name: data.data.supplier.name,
          contactPerson: data.data.supplier.contactPerson || 'N/A',
          email: data.data.supplier.email || '',
          phone: data.data.supplier.phone || '',
          address: data.data.supplier.address?.street || '',
          status: 'active' as const,
          totalProducts: 0,
          lastOrderDate: 'Never'
        }
        
        setSuppliers([addedSupplier, ...suppliers])
        setFilteredSuppliers([addedSupplier, ...filteredSuppliers])
        setShowAddDialog(false)
        setNewSupplier({ name: '', contactPerson: '', email: '', phone: '', address: '' })
        alert('Supplier added successfully!')
      } else {
        alert(`Failed to add supplier: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to add supplier:', error)
      alert('Failed to add supplier. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
              <p className="text-muted-foreground">Manage your supplier relationships</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Enter the supplier information below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Supplier Name *"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Contact Person"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Address"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSupplier} disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Supplier'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers by name, contact person, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>
                {filteredSuppliers.length} of {suppliers.length} suppliers
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
                        <TableHead>Supplier</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Last Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-sm text-muted-foreground">{supplier.address}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.contactPerson}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {supplier.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {supplier.email}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {supplier.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {supplier.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{supplier.totalProducts}</div>
                            <div className="text-sm text-muted-foreground">products</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{supplier.lastOrderDate}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                              {supplier.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
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