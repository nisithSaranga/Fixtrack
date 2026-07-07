"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, MapPin, Phone } from "lucide-react"

export default function SOSPage() {
  const { user, userData } = useAuth()
  const [sosData, setSosData] = useState({
    location: { latitude: "", longitude: "" },
    description: "",
    vehicleId: "",
    urgency: "",
    phoneNumber: "",
    userId: userData ? userData.uid : "",
  })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (userData?.uid) {
      fetchVehicles()
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
        setVehiclesLoading(false)
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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setSosData((prev) => ({
            ...prev,
            location: { latitude, longitude },
          }))
          toast({
            title: "Location Acquired",
            description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          })
        },
        (error) => {
          toast({
            title: "Error",
            description: "Unable to get location. Please allow location access or enter manually.",
            variant: "destructive",
          })
        }
      )
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      })
    }
  }

  const handleSOS = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send SOS request to API
      const response = await fetch("http://localhost:5000/api/emergency/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sosData),
      })

      if (response.ok) {
        toast({
          title: "SOS Alert Sent!",
          description: "A certified mechanic has been notified and will contact you shortly.",
        })

        // Reset form
        setSosData({
          location: { latitude: "", longitude: "" },
          description: "",
          vehicleId: "",
          urgency: "",
          phoneNumber: "",
          userId: userData ? userData.uid : "",
        })
      } else {
        throw new Error("Failed to send SOS alert")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SOS alert. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setSosData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600 flex items-center">
          <AlertTriangle className="mr-3 h-8 w-8" />
          Emergency SOS
        </h1>
        <p className="text-muted-foreground">Send an emergency alert to certified mechanics in your area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Emergency Request Form</CardTitle>
            <CardDescription>Fill out this form to send an immediate alert to nearby mechanics</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSOS} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Current Location *</Label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={
                        sosData.location.latitude && sosData.location.longitude
                          ? `Lat: ${sosData.location.latitude.toFixed(4)}, Lon: ${sosData.location.longitude.toFixed(4)}`
                          : ""
                      }
                      placeholder="Click button to get location"
                      className="pl-10"
                      readOnly
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleGetLocation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Get Location
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Contact Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+94712345678"
                    value={sosData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle</Label>
                <Select
                  onValueChange={(value) => handleChange("vehicleId", value)}
                  value={sosData.vehicleId}
                  disabled={vehiclesLoading || vehicles.length === 0}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={vehiclesLoading ? "Loading vehicles..." : "Select your vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {vehicles.length === 0 && !vehiclesLoading && (
                  <p className="text-sm text-red-600">No vehicles found. Please add a vehicle in the Vehicles section.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select onValueChange={(value) => handleChange("urgency", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical - Vehicle won't start</SelectItem>
                    <SelectItem value="high">High - Safety concern</SelectItem>
                    <SelectItem value="medium">Medium - Breakdown</SelectItem>
                    <SelectItem value="low">Low - Minor issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Problem Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the problem with your vehicle..."
                  value={sosData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading} size="lg">
                {loading ? "Sending SOS Alert..." : "Send Emergency SOS Alert"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How SOS Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-red-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Submit Emergency Request</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form with your location and problem details
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-red-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Instant SMS Alert</h4>
                  <p className="text-sm text-muted-foreground">
                    Certified mechanics in your area receive immediate SMS notification
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-red-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Quick Response</h4>
                  <p className="text-sm text-muted-foreground">
                    A mechanic will contact you within 15 minutes to assist
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Emergency Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• Move to a safe location if possible</p>
              <p className="text-sm">• Turn on hazard lights</p>
              <p className="text-sm">• Stay with your vehicle</p>
              <p className="text-sm">• Keep your phone charged</p>
              <p className="text-sm">• Have your vehicle registration ready</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}