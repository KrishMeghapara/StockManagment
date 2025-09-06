"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { Package, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

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
        // Store auth data
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("current_user", JSON.stringify({
          id: data.data.user.id,
          name: `${data.data.user.firstName} ${data.data.user.lastName}`,
          email: data.data.user.email,
          role: data.data.user.role,
          status: "Active"
        }))
        
        router.push("/dashboard")
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      setError("Connection error. Please check if the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Manager</h1>
          <p className="text-gray-600 mt-2">Inventory Management System</p>
        </div>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="text-sm">
                  {error}
                </Alert>
              )}
              
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-semibold text-primary"
                  onClick={() => router.push("/register")}
                >
                  Register here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Secure inventory management for your business
          </p>
        </div>
      </div>
    </div>
  )
}