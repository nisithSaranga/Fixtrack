"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function GarageServicesPage() {
  const { userData, loading } = useAuth()
  const [services, setServices] = useState([])
  const [customStatus, setCustomStatus] = useState({})
  const { toast } = useToast()

  useEffect(() => {
    if (loading || !userData?.uid) return

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

    fetchServices()
  }, [userData, loading, toast])

  const handleUpdateServiceProgress = async (serviceId, status, statusDescription) => {
    try {
      const response = await fetch(`http://localhost:5000/api/service/progress/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, statusDescription }),
      })
      if (response.ok) {
        setServices((prev) =>
          prev.map((svc) =>
            svc.id === serviceId
              ? {
                  ...svc,
                  progress: [...svc.progress, { status, statusDescription, updatedAt: new Date().toISOString() }],
                  lastUpdated: new Date().toISOString(),
                }
              : svc
          )
        )
        toast({
          title: "Progress Updated",
          description: `Progress updated to "${status}".`,
        })
      } else {
        throw new Error("Failed to update progress")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service progress.",
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
    "Add Custom Status",
  ]

  const pendingServices = services.filter((s) => s.clientStatus === "pending")
  const approvedServices = services.filter((s) => s.clientStatus === "approved")
  const rejectedServices = services.filter((s) => s.clientStatus === "rejected")

  console.log("Pending services:", pendingServices)
  console.log("All services:", services)

  const renderServiceCard = (service, showProgressUpdate = false) => {
    const currentStatus = service.progress[service.progress.length - 1]?.status || "pending"
    const currentDescription = service.progress[service.progress.length - 1]?.statusDescription || ""

    return (
      <div key={service.id} className="p-4 border rounded-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <p className="font-medium">
              {service.vehicle.make} {service.vehicle.model} ({service.vehicle.year})
            </p>
            <p className="text-sm text-muted-foreground">Cost: LKR {Number(service.estimatedCost).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Description: {service.description}</p>
            <p className="text-sm text-muted-foreground">Estimated Time: {service.estimatedTime}</p>
          </div>
          <div className="text-right space-y-1">
            <Badge variant="default">Client Approval: {service.clientStatus}</Badge> <br/>
            <Badge variant={service.paymentStatus === "paid" ? "default" : "destructive"}>Payment Status: {service.paymentStatus}</Badge>
            
          </div>
        </div>
        <p className="font-medium">Current Progress</p>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status: {currentStatus}</p>
          <p className="text-sm text-muted-foreground">Status Note: {currentDescription}</p>
          {/*<p className="text-xs text-muted-foreground">
            Last Updated: {new Date(service.lastUpdated).toLocaleString()}
          </p>*/}
        </div>

        {showProgressUpdate && (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Progress Status</label>
      <Select
        value={customStatus[service.id]?.status || ""}
        onValueChange={(value) => {
          setCustomStatus((prev) => ({
            ...prev,
            [service.id]: {
              ...prev[service.id],
              status: value === "Add Custom Status" ? "" : value,
            },
          }))
        }}
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

      {customStatus[service.id]?.status === "" && (
        <Input
          placeholder="Enter custom status"
          value={customStatus[service.id]?.custom || ""}
          onChange={(e) =>
            setCustomStatus((prev) => ({
              ...prev,
              [service.id]: {
                ...prev[service.id],
                custom: e.target.value,
              },
            }))
          }
        />
      )}
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Status Description</label>
      <Input
        placeholder="Add a status description"
        value={customStatus[service.id]?.description || ""}
        onChange={(e) =>
          setCustomStatus((prev) => ({
            ...prev,
            [service.id]: {
              ...prev[service.id],
              description: e.target.value,
            },
          }))
        }
      />
    </div>

    <div className="col-span-2">
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => {
          const entry = customStatus[service.id]
          const status = entry?.status || entry?.custom
          const description = entry?.description

          if (status && description) {
            handleUpdateServiceProgress(service.id, status, description)
            setCustomStatus((prev) => {
              const updated = { ...prev }
              delete updated[service.id]
              return updated
            })
          } else {
            toast({
              title: "Missing Input",
              description: "Please fill in both status and description.",
              variant: "destructive",
            })
          }
        }}
      >
        Submit Progress Update
      </button>
    </div>
  </div>
)}

      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Manage services assigned to your garage.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Services</CardTitle>
          <CardDescription>Manage ongoing and completed services</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingServices.length === 0 ? (
                <p className="text-center text-muted-foreground">No pending services.</p>
              ) : (
                pendingServices.map((service) => renderServiceCard(service))
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedServices.length === 0 ? (
                <p className="text-center text-muted-foreground">No approved services.</p>
              ) : (
                approvedServices.map((service) => renderServiceCard(service, true))
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejectedServices.length === 0 ? (
                <p className="text-center text-muted-foreground">No rejected services.</p>
              ) : (
                rejectedServices.map((service) => renderServiceCard(service))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
