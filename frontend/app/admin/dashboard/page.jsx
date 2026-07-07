"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSidebar } from "@/components/dashboard/admin-sidebar"
import { useRouter } from "next/navigation"
import { AlertTriangle, Car, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({
    totalEmergencies: 0,
    pendingEmergencies: 0,
    activeServices: 0,
  })
  const [emergencies, setEmergencies] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/emergency/", {
          headers: { "Content-Type": "application/json" },
        })
        if (response.ok) {
          const data = await response.json()
          setEmergencies(data.slice(0, 5)) // Show only 5 recent emergencies
          setStats({
            totalEmergencies: data.length,
            pendingEmergencies: data.filter((e) => e.status === "pending").length,
            activeServices: data.filter((e) => e.status === "in-service").length,
          })
        } else {
          throw new Error("Failed to fetch emergencies")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch emergencies.",
          variant: "destructive",
        })
      }
    }
    fetchEmergencies()
  }, [toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {userData?.name}!</h1>
        <p className="text-muted-foreground">Admin dashboard for managing emergencies and garages.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmergencies}</div>
            <p className="text-xs text-muted-foreground">All SOS requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEmergencies}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Emergencies</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalEmergencies)-(stats.pendingEmergencies)}</div>
            <p className="text-xs text-muted-foreground">Are already assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Emergencies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emergencies</CardTitle>
          <CardDescription>Latest SOS requests received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencies.length === 0 ? (
              <p className="text-center text-muted-foreground">No emergencies found.</p>
            ) : (
              emergencies.map((emergency) => (
                <div key={emergency.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{emergency.description}</p>
                    <p className="text-sm text-muted-foreground">Urgency: {emergency.urgency}</p>
                    <p className="text-xs text-muted-foreground">
                      Location: Lat {emergency.location.latitude.toFixed(4)}, Lon {emergency.location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={emergency.status === "pending" ? "destructive" : "default"}>{emergency.status}</Badge>
                    {/*<p className="text-xs text-muted-foreground">{new Date(emergency.createdAt).toLocaleString()}</p>*/}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/admin/emergencies">
            <Button variant="link" className="mt-4">View All Emergencies</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}