"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, getCurrentUser, hasPermission } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "Owner" | "Manager" | "Staff"
  requiredPermission?: string
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push(fallbackPath)
        return
      }

      const user = getCurrentUser()
      if (!user) {
        router.push(fallbackPath)
        return
      }

      // Check role requirement
      if (requiredRole) {
        const roleHierarchy = { Staff: 1, Manager: 2, Owner: 3 }
        const userLevel = roleHierarchy[user.role] || 0
        const requiredLevel = roleHierarchy[requiredRole] || 0

        if (userLevel < requiredLevel) {
          router.push("/dashboard") // Redirect to dashboard if insufficient role
          return
        }
      }

      // Check permission requirement
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/dashboard") // Redirect to dashboard if insufficient permission
        return
      }

      setHasAccess(true)
      setIsLoading(false)
    }

    checkAccess()
  }, [router, requiredRole, requiredPermission, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}

// Default export for convenience
export default ProtectedRoute
