"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClientServicesPage() {
  const { userData, loading } = useAuth()
  const [services, setServices] = useState([])
  const [confirmApprove, setConfirmApprove] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    if (loading || !userData?.uid) return

    const fetchServices = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/service/user/${userData.uid}`, {
          headers: { "Content-Type": "application/json" },
        })
        if (response.ok) {
          const data = await response.json()
          const enrichedServices = await Promise.all(
            data.map(async (service) => {
              // Fetch emergency to get vehicleId
              const emergencyResponse = await fetch(`http://localhost:5000/api/emergency/${service.emergencyId}`)
              const emergency = await emergencyResponse.json()
              // Fetch vehicle details
              const vehicleResponse = emergency.vehicleId
                ? await fetch(`http://localhost:5000/api/vehicles/byId/${emergency.vehicleId}`)
                : null
              const vehicle = vehicleResponse && vehicleResponse.ok ? await vehicleResponse.json() : {}
              // Fetch garage details
              const garageResponse = await fetch(`http://localhost:5000/api/auth/${service.garageId}`)
              const garage = garageResponse.ok ? await garageResponse.json() : {}
              return {
                ...service,
                vehicle: vehicle || { make: "Unknown", model: "", year: "", licensePlate: "" },
                garageName: garage.name || "Unknown Garage",
                garageLocation: garage.garageLocation || { latitude: 0, longitude: 0 },
              }
            })
          )
          setServices(enrichedServices)
        } else {
          throw new Error("Failed to fetch services")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch services.",
          variant: "destructive",
        })
        setServices([
          
        ])
      }
    }

    fetchServices()
  }, [userData, loading, toast])

  const handleApproveService = async (serviceId) => {
    console.log("Approving service:", serviceId)
    try {
      const response = await fetch(`http://localhost:5000/api/service/approve/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        setServices((prev) =>
          prev.map((svc) =>
            svc.id === serviceId ? { ...svc, isClientApproved: true, clientStatus: "approved" } : svc
          )
        )
        toast({
          title: "Service Approved",
          description: "Service has been approved successfully.",
        })
      } else {
        throw new Error("Failed to approve service")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve service.",
        variant: "destructive",
      })
    }
    setConfirmApprove(null)
  }

  const handleRejectService = async (serviceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/service/reject/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        setServices((prev) =>
          prev.map((svc) =>
            svc.id === serviceId ? { ...svc, isClientApproved: false, clientStatus: "rejected" } : svc
          )
        )
        toast({
          title: "Service Rejected",
          description: "Service has been rejected successfully.",
        })
      } else {
        throw new Error("Failed to reject service")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject service.",
        variant: "destructive",
      })
    }
  }

  const approvedServices = services.filter((s) => s.isClientApproved)
  const notApprovedServices = services.filter((s) => !s.isClientApproved)
  console.log("services:", services)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Services</h1>
        <p className="text-muted-foreground">View and manage your service requests.</p>
      </div>

      <Tabs defaultValue="approved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approved">Approved Services</TabsTrigger>
          <TabsTrigger value="not-approved">Not Approved Services</TabsTrigger>
        </TabsList>
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Services</CardTitle>
              <CardDescription>Your approved service requests</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedServices.length === 0 ? (
                <p className="text-center text-muted-foreground">No approved services at this time.</p>
              ) : (
                approvedServices.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {service.vehicle.make} {service.vehicle.model} ({service.vehicle.year})
                        </p>
                        <p className="text-sm text-muted-foreground">License Plate: {service.vehicle.licensePlate}</p>
                        <p className="text-sm text-muted-foreground">Garage: {service.garageName}</p>
                        <p
                          className="text-sm text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => {
                            const { latitude, longitude } = service.garageLocation;
                            const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                            window.open(url, "_blank");
                          }}
                        >
                          Garage Location: Lat {service.garageLocation.latitude.toFixed(4)} Lon {service.garageLocation.longitude.toFixed(4)}
                        </p>
                        <p className="text-sm text-muted-foreground">Cost: LKR {Number(service.estimatedCost).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Description: {service.description}</p>
                        <p className="text-sm text-muted-foreground">Estimated Time: {service.estimatedTime}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={service.clientStatus === "approved" ? "default" : "secondary"}>
                          Your approval: {service.clientStatus}
                        </Badge>
                        <br/>
                        <Badge variant={service.paymentStatus === "paid" ? "default" : "destructive"}>
                          Payment Status: {service.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Progress Timeline</p>
                      <div className="space-y-2">
                        {service.progress.map((entry, index) => (
                          <div
                            key={index}
                            className={`p-2 border-l-4 ${
                              index === service.progress.length - 1
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300"
                            } pl-4`}
                          >
                            <p className="text-sm font-medium">{entry.status}</p>
                            <p className="text-sm text-muted-foreground">{entry.statusDescription}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.updatedAt?._seconds
                                ? new Date(entry.updatedAt._seconds * 1000).toLocaleString()
                                : new Date(service.createdAt._seconds * 1000).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="not-approved">
          <Card>
            <CardHeader>
              <CardTitle>Not Approved Services</CardTitle>
              <CardDescription>Service requests awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {notApprovedServices.length === 0 ? (
                <p className="text-center text-muted-foreground">No services awaiting approval.</p>
              ) : (
                notApprovedServices.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {service.vehicle.make} {service.vehicle.model} ({service.vehicle.year})
                        </p>
                        <p className="text-sm text-muted-foreground">License Plate: {service.vehicle.licensePlate}</p>
                        <p className="text-sm text-muted-foreground">Garage: {service.garageName}</p>
                        <p
                          className="text-sm text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => {
                            const { latitude, longitude } = service.garageLocation;
                            const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                            window.open(url, "_blank");
                          }}
                        >
                          Garage Location: Lat {service.garageLocation.latitude.toFixed(4)} Lon {service.garageLocation.longitude.toFixed(4)}
                        </p>
                        <p className="text-sm text-muted-foreground">Cost: LKR {Number(service.estimatedCost).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Description: {service.description}</p>
                        <p className="text-sm text-muted-foreground">Estimated Time: {service.estimatedTime}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={service.clientStatus === "approved" ? "default" : "secondary"}>
                          Your approval: {service.clientStatus}
                        </Badge>
                        <br/>
                        <Badge variant={service.paymentStatus === "paid" ? "default" : "destructive"}>
                          Payment Status: {service.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => setConfirmApprove(service.id)}
                        disabled={service.clientStatus === "rejected"}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectService(service.id)}
                        disabled={service.clientStatus === "rejected"}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Service Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApproveService(confirmApprove)}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}