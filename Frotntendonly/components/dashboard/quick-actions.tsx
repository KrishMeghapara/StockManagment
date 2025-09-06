"use client"

import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Package, FileText } from "lucide-react"
import Link from "next/link"
import { getCurrentUser, hasPermission } from "@/lib/auth"

export function QuickActions() {
  const user = getCurrentUser()

  const actions = [
    {
      label: "Add Product",
      href: "/products/add",
      icon: Package,
      variant: "default" as const,
      requiredRole: "staff",
    },
    {
      label: "New Sale",
      href: "/sales/new",
      icon: ShoppingCart,
      variant: "secondary" as const,
      requiredRole: "staff",
    },
    {
      label: "Add Purchase",
      href: "/purchases/new",
      icon: Plus,
      variant: "outline" as const,
      requiredRole: "manager",
    },
    {
      label: "View Reports",
      href: "/reports",
      icon: FileText,
      variant: "ghost" as const,
      requiredRole: "manager",
    },
  ]

  const filteredActions = actions.filter((action) => user && hasPermission(user.role, action.requiredRole))

  return (
    <div className="flex gap-2 flex-wrap">
      {filteredActions.map((action) => (
        <Button key={action.label} variant={action.variant} size="sm" asChild>
          <Link href={action.href} className="flex items-center gap-2">
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
