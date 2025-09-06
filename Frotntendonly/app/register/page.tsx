"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { register, isAuthenticated } from "@/lib/auth"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"Owner" | "Manager" | "Staff">("Owner")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if this is first user registration
    const checkFirstUser = async () => {
      try {
        const response = await fetch("/api/auth/setup-status")
        const data = await response.json()
        setIsFirstUser(data.success && data.data.needsSetup)
      } catch {
        setIsFirstUser(true)
      }
    }
    checkFirstUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const result = await register({
        username,
        firstName,
        lastName,
        email,
        password,
        role
      })

      if (result.success) {
        setSuccess(isFirstUser ? "First user (owner) registered successfully!" : "User registered successfully!")
        // Clear form
        setUsername("")
        setFirstName("")
        setLastName("")
        setEmail("")
        setPassword("")
        setRole("Owner")
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (err) {
      setError("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isFirstUser ? "Setup First User (Owner)" : "Register New User"}
          </CardTitle>
          <CardDescription>
            {isFirstUser 
              ? "Create the first user account with owner privileges"
              : "Add a new user to the system"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as "Owner" | "Manager" | "Staff")}
                disabled={isFirstUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              {isFirstUser && (
                <p className="text-xs text-blue-600">
                  First user will be automatically assigned Owner role
                </p>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}
            {success && (
              <Alert>
                {success}
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={() => router.push("/login")}>
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}