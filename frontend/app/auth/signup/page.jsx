"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Wrench, Eye, EyeOff, MapPin, Phone } from "lucide-react"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "",
    garageLocation: { latitude: null, longitude: null },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  })

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.role === "garage" && (!formData.garageLocation.latitude || !formData.garageLocation.longitude)) {
      toast({
        title: "Location required",
        description: "Please select a garage location",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Save user data to Firestore
      const userData = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        createdAt: new Date().toISOString(),
      }

      if (formData.role === "garage") {
        userData.garageLocation = {
          latitude: formData.garageLocation.latitude,
          longitude: formData.garageLocation.longitude,
        }
      }

      await setDoc(doc(db, "users", user.uid), userData)

      toast({
        title: "Account created successfully",
        description: "Welcome to FixTrack!",
      })

      // Redirect based on role
      switch (formData.role) {
        case "client":
          router.push("/client/dashboard")
          break
        case "garage":
          router.push("/garage/dashboard")
          break
        case "admin":
          router.push("/admin/dashboard")
          break
        default:
          router.push("/client/dashboard")
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMapClick = (event) => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    setSelectedLocation({ lat, lng })
    setFormData((prev) => ({
      ...prev,
      garageLocation: { latitude: lat, longitude: lng },
    }))
  }

  const handleConfirmLocation = () => {
    setIsMapDialogOpen(false)
  }

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  }

  const defaultCenter = {
    lat: 0,
    lng: 0,
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/fix-track-logo-removebg.png" width={65}/>
          </div>
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Join FixTrack and get started today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="phone"
                placeholder="+94712345678"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select onValueChange={(value) => handleChange("role", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Vehicle Owner</SelectItem>
                  <SelectItem value="garage">Garage/Mechanic</SelectItem>
                  {/*<SelectItem value="admin">Administrator</SelectItem>*/}
                </SelectContent>
              </Select>
            </div>
            {formData.role === "garage" && (
              <div className="space-y-2">
                <Label htmlFor="garageLocation">Garage Location</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="garageLocation"
                    value={
                      formData.garageLocation.latitude && formData.garageLocation.longitude
                        ? `Lat: ${formData.garageLocation.latitude.toFixed(4)}, Lon: ${formData.garageLocation.longitude.toFixed(4)}`
                        : ""
                    }
                    placeholder="Click button to select location"
                    readOnly
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => setIsMapDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Select Location
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Garage Location</DialogTitle>
          </DialogHeader>
          {isLoaded ? (
            <div>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedLocation || defaultCenter}
                zoom={2}
                onClick={handleMapClick}
              >
                {selectedLocation && <Marker position={selectedLocation} />}
              </GoogleMap>
              {selectedLocation && (
                <p className="mt-2 text-sm">
                  Selected: Lat: {selectedLocation.lat.toFixed(4)}, Lon: {selectedLocation.lng.toFixed(4)}
                </p>
              )}
              <Button
                className="mt-4 w-full"
                onClick={handleConfirmLocation}
                disabled={!selectedLocation}
              >
                Confirm Location
              </Button>
            </div>
          ) : (
            <p>Loading map...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}