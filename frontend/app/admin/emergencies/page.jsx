"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmergenciesPage() {
  const { userData } = useAuth()
  const [emergencies, setEmergencies] = useState([])
  const [nearbyGarages, setNearbyGarages] = useState({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/emergency/", {
          headers: { "Content-Type": "application/json" },
        })
        if (response.ok) {
          const data = await response.json()
          setEmergencies(data)
        } else {
          throw new Error("Failed to fetch emergencies")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch emergencies. Using dummy data.",
          variant: "destructive",
        })
      }
    }
    fetchEmergencies()
  }, [toast])

  const fetchNearbyGarages = async (emergencyId, location) => {
    setLoading(true)
    console.log("Fetching nearby garages for emergency:", emergencyId, "at location:", location)
    try {
      const response = await fetch("http://localhost:5000/api/emergency/garages/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      })
      console.log(response)
      if (response.ok) {
        const garages = await response.json()
        setNearbyGarages((prev) => ({ ...prev, [emergencyId]: garages }))
      } else {
        throw new Error("Failed to fetch nearby garages")
      }
    } catch (error) {
      console.log("Error fetching nearby garages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch nearby garages.",
        variant: "destructive",
      })
      setNearbyGarages((prev) => ({
        ...prev,
        [emergencyId]: [
          
        ],
      }))
    } finally {
      setLoading(false)
    }
  }

  const assignGarage = async (emergencyId, garageId) => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/emergency/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyId, garageId }),
      })
      if (response.ok) {
        setEmergencies((prev) =>
          prev.map((em) =>
            em.id === emergencyId ? { ...em, status: "assigned", assignedGarageId: garageId } : em
          )
        )
        setNearbyGarages((prev) => {
          const newGarages = { ...prev }
          delete newGarages[emergencyId]
          return newGarages
        })
        toast({
          title: "Success",
          description: "Garage assigned to emergency.",
        })
      } else {
        throw new Error("Failed to assign garage")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign garage.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const statusTabs = ["pending", "assigned"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergencies</h1>
        <p className="text-muted-foreground">Manage all SOS requests and assign garages.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {statusTabs.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>{status.charAt(0).toUpperCase() + status.slice(1)} Emergencies</CardTitle>
                <CardDescription>
                  {status === "pending" ? "Assign garages to these emergencies" : `View ${status} SOS requests`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencies
                    .filter((em) => em.status === status)
                    .map((emergency) => (
                      <div key={emergency.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="space-y-1">
                            <p className="font-medium">{emergency.description}</p>
                            <p className="text-sm text-muted-foreground">Urgency: {emergency.urgency}</p>
                            <p className="text-sm text-muted-foreground">Phone: {emergency.phoneNumber}</p>
                            <p
                              className="text-xs text-muted-foreground cursor-pointer hover:underline"
                              onClick={() => {
                                const lat = emergency.location.latitude;
                                const lon = emergency.location.longitude;
                                const url = `https://www.google.com/maps?q=${lat},${lon}`;
                                window.open(url, "_blank");
                              }}
                            >
                              Location: Lat {emergency.location.latitude.toFixed(4)}, Lon {emergency.location.longitude.toFixed(4)}
                            </p>
                            {/*<p className="text-xs text-muted-foreground">
                              Created: {new Date(emergency.createdAt).toLocaleString()}
                            </p>*/}
                          </div>
                          <Badge variant={emergency.status === "pending" ? "destructive" : "default"}>{emergency.status}</Badge>
                        </div>
                        {emergency.status === "pending" && (
                          <div className="mt-4">
                            <Button
                              onClick={() => fetchNearbyGarages(emergency.id, emergency.location)}
                              disabled={loading}
                              className="mb-2"
                            >
                              Find Nearest Garages
                            </Button>
                            {nearbyGarages[emergency.id] && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Nearby Garages:</p>
                                {nearbyGarages[emergency.id].length > 0 ? (
                                  nearbyGarages[emergency.id].map((garage) => (
                                    <div key={garage.id} className="flex items-center justify-between p-2 border rounded">
                                      <div>
                                        <p className="text-sm">{garage.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Distance: {garage.distance.toFixed(2)} km
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => assignGarage(emergency.id, garage.id)}
                                          disabled={loading}
                                          size="sm"
                                        >
                                          Assign
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const { latitude, longitude } = garage.garageLocation;
                                            const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                                            window.open(url, "_blank");
                                          }}
                                        >
                                          See Location
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No nearby garages.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  {emergencies.filter((em) => em.status === status).length === 0 && (
                    <p className="text-center text-muted-foreground">No {status} emergencies found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}