"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, AlertTriangle, Clock, CreditCard, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ClientDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeServices: 0,
    pendingPayments: 0,
    sosRequests: 0,
  })
  const [vehicles, setVehicles] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [services, setServices] = useState([])
  const [payments, setPayments] = useState([])
  const activeServices = services.filter(service => service.progress.status !== "Completed")
  const { toast } = useToast()

  useEffect(() => {
    if (userData?.uid) {
      fetchVehicles()
      fetchEmergencies()
    }
  }, [userData])

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/byuserId/${userData.uid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      } else {
        console.error("Failed to fetch vehicles:", response.status, response.statusText)
        toast({
          title: "Error",
          description: "Failed to fetch vehicles. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching vehicles.",
        variant: "destructive",
      })
    }
  }

  const fetchEmergencies = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/emergency/user/${userData.uid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEmergencies(data)
      } else {
        console.error("Failed to fetch emergencies:", response.status, response.statusText)
        toast({
          title: "Error",
          description: "Failed to fetch emergencies. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching emergencies:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching emergencies.",
        variant: "destructive",
      })
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/service/user/${userData.uid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        console.error("Failed to fetch services:", response.status, response.statusText)
        toast({
          title: "Error",
          description: "Failed to fetch services. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching services.",
        variant: "destructive",
      })
    }
  }

  const fetchPayments = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payment/user/${userId}`)
      if (!response.ok) throw new Error("Failed to fetch payments")
      const data = await response.json()

      const formatted = data.map((payment) => ({
        ...payment,
        cost: Number(payment.cost),
        createdAt: payment.createdAt?._seconds ? new Date(payment.createdAt._seconds * 1000) : new Date(),
        status: payment.paymentStatus,
        description: `Service Payment`,
        vehicleInfo: payment.vehicle,
      }))

      setPayments(formatted)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load payment data.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (userData?.uid) {
      fetchServices()
      fetchPayments(userData.uid)
    }
  }, [userData])

  useEffect(() => {
    setStats({
      activeServices: 1,
      pendingPayments: 1,
      sosRequests: 0,
    })
  }, [])

  const recentServices = [
    {
      id: "1",
      vehicle: "2020 Honda Civic",
      service: "Oil Change",
      status: "In Progress",
      estimatedCompletion: "2 hours",
      mechanic: "Mike's Auto Shop",
    },
    {
      id: "2",
      vehicle: "2018 Toyota Camry",
      service: "Brake Inspection",
      status: "Completed",
      estimatedCompletion: "Completed",
      mechanic: "Quick Fix Garage",
    },
  ]

  const pendingPayments = payments.filter((p) => p.status === "pending")
  const completedPayments = payments.filter((p) => p.status === "paid")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userData?.name}!</h1>
        <p className="text-muted-foreground">Here's an overview of your vehicle services and activities.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">Registered vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices.length}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOS Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emergencies.length}</div>
            <p className="text-xs text-muted-foreground">Emergency requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/client/vehicles">
              <Button className="w-full h-20 flex flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Add Vehicle
              </Button>
            </Link>
            <Link href="/client/sos">
              <Button variant="destructive" className="w-full h-20 flex flex-col">
                <AlertTriangle className="h-6 w-6 mb-2" />
                Emergency SOS
              </Button>
            </Link>
            <Link href="/client/payments">
              <Button variant="outline" className="w-full h-20 flex flex-col bg-transparent">
                <CreditCard className="h-6 w-6 mb-2" />
                Make Payment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>Your latest vehicle service activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.length === 0 && (
              <p className="text-muted-foreground">No recent services found.</p>
            )}
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{service.vehicle}</p>
                  <p className="text-sm text-muted-foreground">{service.service}</p>
                  <p className="text-xs text-muted-foreground">{service.mechanic}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={service.status === "Completed" ? "default" : "secondary"}>{service.status}</Badge>
                  <p className="text-xs text-muted-foreground">{service.estimatedCompletion}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
