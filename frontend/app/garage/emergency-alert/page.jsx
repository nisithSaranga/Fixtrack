"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function EmergencyAlertsPage() {
  const { userData } = useAuth()
  const [sosRequests, setSosRequests] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    // Dummy data for SOS requests
    setSosRequests([
      {
        id: "sos1",
        vehicle: "2020 Honda Civic",
        client: "John Doe",
        issue: "Flat tire",
        location: "123 Main St",
        timestamp: "2025-07-19T05:00:00Z",
        status: "Pending",
      },
      {
        id: "sos2",
        vehicle: "2018 Toyota Camry",
        client: "Jane Smith",
        issue: "Dead battery",
        location: "456 Oak Ave",
        timestamp: "2025-07-19T04:30:00Z",
        status: "Accepted",
      },
    ])
  }, [])

  const handleUpdateSosStatus = async (requestId, newStatus) => {
    try {
      // Update SOS request in Firestore
      await setDoc(
        doc(db, "sos_requests", requestId),
        {
          status: newStatus,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      )

      // Update local state
      setSosRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus, lastUpdated: new Date().toISOString() } : req
        )
      )

      toast({
        title: "SOS Status Updated",
        description: `Status updated to "${newStatus}" for SOS request.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update SOS status.",
        variant: "destructive",
      })
    }
  }

  const sosStatusOptions = ["Pending", "Accepted", "Resolved"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Alerts</h1>
        <p className="text-muted-foreground">Manage SOS requests received by your garage.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SOS Requests</CardTitle>
          <CardDescription>View and update emergency alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sosRequests.length === 0 ? (
              <p className="text-center text-muted-foreground">No SOS requests at this time.</p>
            ) : (
              sosRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{request.vehicle}</p>
                    <p className="text-sm text-muted-foreground">Issue: {request.issue}</p>
                    <p className="text-sm text-muted-foreground">Client: {request.client}</p>
                    <p className="text-sm text-muted-foreground">Location: {request.location}</p>
                    <p className="text-xs text-muted-foreground">
                      Received: {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge variant={request.status === "Pending" ? "destructive" : request.status === "Accepted" ? "secondary" : "default"}>
                      {request.status}
                    </Badge>
                    <Select
                      onValueChange={(value) => handleUpdateSosStatus(request.id, value)}
                      defaultValue={request.status}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        {sosStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}