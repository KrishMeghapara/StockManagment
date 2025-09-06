// Authentication utilities for the stock management system

export interface User {
  id: number
  name: string
  email: string
  role: "Owner" | "Manager" | "Staff"
  status: "Active" | "Inactive"
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  const token = localStorage.getItem("auth_token")
  const user = localStorage.getItem("current_user")
  return !!(token && user)
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("current_user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

// Get user role
export function getUserRole(): string | null {
  const user = getCurrentUser()
  return user?.role || null
}

// Check if user has specific role or higher
export function hasRole(requiredRole: "Owner" | "Manager" | "Staff"): boolean {
  const user = getCurrentUser()
  if (!user) return false

  const roleHierarchy = { Staff: 1, Manager: 2, Owner: 3 }
  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel
}

// Login function
export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.success) {
      const user: User = {
        id: data.data.user.id,
        name: `${data.data.user.firstName} ${data.data.user.lastName}`,
        email: data.data.user.email,
        role: data.data.user.role.charAt(0).toUpperCase() + data.data.user.role.slice(1) as "Owner" | "Manager" | "Staff",
        status: "Active",
      }

      // Store auth data
      localStorage.setItem("auth_token", data.data.token)
      localStorage.setItem("current_user", JSON.stringify(user))

      return { success: true, user }
    }

    return { success: false, error: data.message || "Invalid credentials" }
  } catch (error) {
    return { success: false, error: "Connection error. Please check if the backend is running." }
  }
}

// Register function
export async function register(userData: {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  role?: "Owner" | "Manager" | "Staff"
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const token = getAuthToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch("/api/auth/public-register", {
      method: "POST",
      headers,
      body: JSON.stringify({
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role?.toLowerCase()
      }),
    })

    const data = await response.json()

    if (data.success) {
      const user: User = {
        id: data.data.user.id,
        name: `${data.data.user.firstName} ${data.data.user.lastName}`,
        email: data.data.user.email,
        role: data.data.user.role.charAt(0).toUpperCase() + data.data.user.role.slice(1) as "Owner" | "Manager" | "Staff",
        status: "Active",
      }

      return { success: true, user }
    }

    return { success: false, error: data.message || "Registration failed" }
  } catch (error) {
    return { success: false, error: "Connection error. Please check if the backend is running." }
  }
}

// Logout function
export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("current_user")
}

// Check if user can access a specific feature
export function canAccess(feature: string): boolean {
  const user = getCurrentUser()
  if (!user || user.status !== "Active") return false

  // Define role-based permissions
  const permissions = {
    Owner: ["users", "reports", "products", "sales", "purchases", "dashboard"],
    Manager: ["reports", "products", "sales", "purchases", "dashboard"],
    Staff: ["products", "sales", "dashboard"],
  }

  const userPermissions = permissions[user.role] || []
  return userPermissions.includes(feature)
}

// Get auth token
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// Validate token
export async function validateToken(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false

  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    return response.ok
  } catch {
    return false
  }
}

// Check if user has permission for specific action
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser()
  if (!user || user.status !== "Active") return false

  // Define role-based permissions
  const rolePermissions = {
    Owner: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "products.create",
      "products.read",
      "products.update",
      "products.delete",
      "sales.create",
      "sales.read",
      "sales.update",
      "sales.delete",
      "purchases.create",
      "purchases.read",
      "purchases.update",
      "purchases.delete",
      "reports.read",
      "reports.export",
      "dashboard.read",
    ],
    Manager: [
      "products.create",
      "products.read",
      "products.update",
      "products.delete",
      "sales.create",
      "sales.read",
      "sales.update",
      "sales.delete",
      "purchases.create",
      "purchases.read",
      "purchases.update",
      "purchases.delete",
      "reports.read",
      "reports.export",
      "dashboard.read",
    ],
    Staff: ["products.read", "products.update", "sales.create", "sales.read", "sales.update", "dashboard.read"],
  }

  const userPermissions = rolePermissions[user.role] || []
  return userPermissions.includes(permission)
}
