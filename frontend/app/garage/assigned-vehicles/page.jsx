"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function AssignedVehiclesPage() {
  const { userData } = useAuth()
  const [emergencies, setEmergencies] = useState([])
  const [selectedEmergency, setSelectedEmergency] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const { toast } = useToast()

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
              const serviceData = await serviceRes.json();
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

  const handleCreateService = async () => {
    if (!selectedEmergency) return

    try {
      const response = await fetch("http://localhost:5000/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyId: selectedEmergency.id,
          garageId: userData.uid,
          estimatedTime,
          description,
          estimatedCost,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Service created successfully." })
        setSelectedEmergency(null)
        setEstimatedTime("")
        setDescription("")
        setEstimatedCost("")

        // Refresh emergencies list to reflect new service status
        const refreshedEmergencies = emergencies.map((e) =>
          e.id === selectedEmergency.id ? { ...e, hasService: true } : e
        )
        setEmergencies(refreshedEmergencies)
      } else {
        throw new Error("Failed to create service")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      })
      console.error("Error creating service:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned Emergencies</h1>
        <p className="text-muted-foreground">View assigned emergencies and create services.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Vehicles</CardTitle>
          <CardDescription>Emergencies assigned to your garage with vehicle details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencies.length === 0 ? (
              <p className="text-center text-muted-foreground">No assigned emergencies at this time.</p>
            ) : (
              emergencies.map((emergency) => (
                <div key={emergency.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {emergency.vehicle?.make} {emergency.vehicle?.model} ({emergency.vehicle?.year})
                    </p>
                    <p className="text-sm text-muted-foreground">License Plate: {emergency.vehicle?.licensePlate}</p>
                    <p className="text-sm text-muted-foreground">Client ID: {emergency.userId}</p>
                    <p className="text-sm text-muted-foreground">Description: {emergency.description}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedEmergency(emergency)}
                        disabled={emergency.hasService}
                      >
                        {emergency.hasService ? "Service Created" : "Create Service"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Create Service for {emergency.vehicle?.make} {emergency.vehicle?.model}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Estimated Time in Days"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                        />
                        <Textarea
                          placeholder="Service Description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        <Input
                          placeholder="Estimated Cost (LKR)"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                        />
                        <Button onClick={handleCreateService}>Submit Service</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
