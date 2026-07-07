"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Car, Plus, Edit, Trash2 } from "lucide-react"

export default function VehiclesPage() {
  const { user, userData, loading } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    vin: "",
    userId: userData ? userData.uid : "",
  })
  const [editVehicle, setEditVehicle] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    vin: "",
  })
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

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:5000/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newVehicle),
      })

      if (response.ok) {
        toast({
          title: "Vehicle added successfully",
          description: "Your vehicle has been registered.",
        })
        setIsAddDialogOpen(false)
        setNewVehicle({
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          color: "",
          vin: "",
          userId: userData ? userData.uid : "",
        })
        fetchVehicles()
      } else {
        throw new Error("Failed to add vehicle")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditVehicle = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editVehicle),
      })

      if (response.ok) {
        toast({
          title: "Vehicle updated successfully",
          description: "Your vehicle details have been updated.",
        })
        setIsEditDialogOpen(false)
        setSelectedVehicle(null)
        setEditVehicle({
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          color: "",
          vin: "",
        })
        fetchVehicles()
      } else {
        throw new Error("Failed to update vehicle")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vehicle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVehicle = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicle.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Vehicle deleted successfully",
          description: "The vehicle has been removed.",
        })
        setIsDeleteDialogOpen(false)
        setSelectedVehicle(null)
        fetchVehicles()
      } else {
        throw new Error("Failed to delete vehicle")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (vehicle) => {
    setSelectedVehicle(vehicle)
    setEditVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      vin: vehicle.vin,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "in_service":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Vehicles</h1>
          <p className="text-muted-foreground">Manage your registered vehicles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Register a new vehicle to your account</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="Honda"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Civic"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="2020"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="Blue"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  placeholder="ABC123"
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">VIN Number</Label>
                <Input
                  id="vin"
                  placeholder="1HGBH41JXMN109186"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Add Vehicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(vehicle.status)}>{vehicle.status.replace("_", " ")}</Badge>
              </div>
              <CardDescription>License: {vehicle.licensePlate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span>{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-mono text-xs">{vehicle.vin}</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => openEditDialog(vehicle)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => openDeleteDialog(vehicle)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vehicles registered</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first vehicle to get started with FixTrack services
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update the details of your vehicle</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-make">Make</Label>
                <Input
                  id="edit-make"
                  placeholder="Honda"
                  value={editVehicle.make}
                  onChange={(e) => setEditVehicle({ ...editVehicle, make: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  placeholder="Civic"
                  value={editVehicle.model}
                  onChange={(e) => setEditVehicle({ ...editVehicle, model: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input
                  id="edit-year"
                  placeholder="2020"
                  value={editVehicle.year}
                  onChange={(e) => setEditVehicle({ ...editVehicle, year: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  placeholder="Blue"
                  value={editVehicle.color}
                  onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-licensePlate">License Plate</Label>
              <Input
                id="edit-licensePlate"
                placeholder="ABC123"
                value={editVehicle.licensePlate}
                onChange={(e) => setEditVehicle({ ...editVehicle, licensePlate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vin">VIN Number</Label>
              <Input
                id="edit-vin"
                placeholder="1HGBH41JXMN109186"
                value={editVehicle.vin}
                onChange={(e) => setEditVehicle({ ...editVehicle, vin: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Update Vehicle
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the vehicle{" "}
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVehicle}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}