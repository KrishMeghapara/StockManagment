"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Menu,
  LogOut,
  BarChart3,
  ShoppingBag,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["staff", "manager", "owner"] },
  { name: "Products", href: "/products", icon: Package, roles: ["staff", "manager", "owner"] },
  { name: "Sales", href: "/sales", icon: ShoppingCart, roles: ["staff", "manager", "owner"] },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag, roles: ["manager", "owner"] },
  { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["manager", "owner"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["manager", "owner"] },
  { name: "Users", href: "/users", icon: Users, roles: ["owner"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["owner"] },
]

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const user = getCurrentUser()

  const filteredNavigation = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-sidebar-border">
        <div className="bg-sidebar-primary rounded-lg p-2">
          <Package className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sidebar-foreground">Stock Manager</h2>
          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-sidebar-primary rounded-full p-2">
            <Users className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-50 lg:hidden bg-background shadow-md">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="lg:hidden">
          <div className="h-16"></div>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
