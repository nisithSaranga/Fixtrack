"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function GarageDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeServices: 0,
  })
  const [services, setServices] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [customStatus, setCustomStatus] = useState({})
  const { toast } = useToast()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/service/garage/${userData.uid}`, {
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) throw new Error("Failed to fetch services")

        const servicesList = await response.json()

        const enrichedServices = await Promise.all(
          servicesList.map(async (svc) => {
            try {
              const emergencyRes = await fetch(`http://localhost:5000/api/emergency/vehicles/${svc.emergencyId}`)
              if (!emergencyRes.ok) return svc // fallback to original service

              const emergencyData = await emergencyRes.json()

              return {
                ...svc,
                emergency: emergencyData,
                vehicle: emergencyData.vehicle || { make: "Unknown", model: "", year: "" },
                clientId: emergencyData.userId || "Unknown",
              }
            } catch (err) {
              console.error("Failed to enrich service:", err)
              return svc
            }
          })
        )

        setServices(enrichedServices)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch services.",
          variant: "destructive",
        })
        setServices([])
      }
    }
    if (userData?.uid) {
      fetchServices()
    }
  }, [userData, toast])

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/emergency/garage/${userData.uid}/emergencies`, {
          headers: { "Content-Type": "application/json" },
        })
        if (response.ok) {
          const emergenciesData = await response.json()

          const enrichedEmergencies = await Promise.all(
            emergenciesData.map(async (emergency) => {
              const serviceRes = await fetch(`http://localhost:5000/api/service/emergency/${emergency.id}`)
              const serviceExists = serviceRes.ok
              return { ...emergency, hasService: serviceExists }
            })
          )

          setEmergencies(enrichedEmergencies)
        } else {
          throw new Error("Failed to fetch emergencies")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch emergency data.",
          variant: "destructive",
        })
        setEmergencies([])
      }
    }

    if (userData?.uid) {
      fetchEmergencies()
    }
  }, [userData, toast])

  const handleUpdateService = async (serviceId, vehicleId, newStatus, newNote) => {
    try {
      await setDoc(
        doc(db, "services", serviceId),
        {
          vehicleId,
          garageId: userData.uid,
          status: newStatus,
          statusNote: newNote,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      )
      setServices((prev) =>
        prev.map((svc) =>
          svc.id === serviceId ? { ...svc, status: newStatus, statusNote: newNote, lastUpdated: new Date().toISOString() } : svc
        )
      )
      toast({
        title: "Service Updated",
        description: `Status updated to "${newStatus}" for vehicle.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service status.",
        variant: "destructive",
      })
    }
  }

  const serviceStatusOptions = [
    "Oil Changing",
    "Painting",
    "Brake Inspection",
    "Tire Replacement",
    "Engine Repair",
    "Completed",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userData?.name}!</h1>
        <p className="text-muted-foreground">Manage your garage services and assigned vehicles.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emergencies.length}</div>
            <p className="text-xs text-muted-foreground">Vehicles in service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">Ongoing services</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Manage vehicles currently under service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-center text-muted-foreground">No services at this time.</p>
            ) : (
              services.map((service) => (
                <div key={service.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {service.vehicle.make} {service.vehicle.model} ({service.vehicle.year})
                      </p>
                      <p className="text-sm text-muted-foreground">Client: {service.client}</p>
                      <p className="text-sm text-muted-foreground">Cost: LKR {Number(service.estimatedCost).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Description: {service.description}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={service.status === "Completed" ? "default" : "secondary"}>{service.status}</Badge>
                      <Badge variant={service.paymentStatus === "paid" ? "default" : "destructive"}>{service.paymentStatus}</Badge>
                    </div>
                  </div>
                  {/*<div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Note: {service.statusNote}</p>
                    <p className="text-xs text-muted-foreground">
                      Last Updated: {new Date(service.lastUpdated).toLocaleString()}
                    </p>
                  </div>*/}
                  {/*<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Update Status</label>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            setCustomStatus((prev) => ({ ...prev, [service.id]: "" }))
                            handleUpdateService(service.id, service.vehicleId, value, service.statusNote)
                          }}
                          defaultValue={service.status}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceStatusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Custom status"
                          value={customStatus[service.id] || ""}
                          onChange={(e) => setCustomStatus((prev) => ({ ...prev, [service.id]: e.target.value }))}
                          onBlur={(e) => {
                            if (e.target.value) {
                              handleUpdateService(service.id, service.vehicleId, e.target.value, service.statusNote)
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status Note</label>
                      <Input
                        placeholder="Add a note"
                        defaultValue={service.statusNote}
                        onBlur={(e) => handleUpdateService(service.id, service.vehicleId, service.status, e.target.value)}
                      />
                    </div>
                  </div>*/}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}