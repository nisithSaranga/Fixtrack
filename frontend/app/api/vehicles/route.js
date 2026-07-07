import { NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { make, model, year, licensePlate, color, vin } = body

    // Add vehicle to Firestore
    const vehicleRef = await adminDb.collection("vehicles").add({
      userId,
      make,
      model,
      year,
      licensePlate,
      color,
      vin,
      status: "active",
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      vehicleId: vehicleRef.id,
      message: "Vehicle added successfully",
    })
  } catch (error) {
    console.error("Vehicle API Error:", error)
    return NextResponse.json({ error: "Failed to add vehicle" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get user's vehicles
    const vehiclesSnapshot = await adminDb.collection("vehicles").where("userId", "==", userId).get()

    const vehicles = vehiclesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error("Vehicle API Error:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}
