import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(request) {
  try {
    const body = await request.json()
    const { location, description, vehicleId, urgency, phoneNumber } = body

    // Save SOS request to Firestore
    const sosRef = await adminDb.collection("sos_requests").add({
      location,
      description,
      vehicleId,
      urgency,
      phoneNumber,
      status: "pending",
      createdAt: new Date().toISOString(),
      assignedMechanic: null,
    })

    // Find nearby mechanics (simplified - in production, use geolocation)
    const mechanicsSnapshot = await adminDb.collection("users").where("role", "==", "garage").limit(3).get()

    // Send SMS to mechanics
    const smsPromises = mechanicsSnapshot.docs.map(async (doc) => {
      const mechanicData = doc.data()
      const message = `🚨 EMERGENCY SOS ALERT 🚨
Location: ${location}
Problem: ${description}
Urgency: ${urgency.toUpperCase()}
Contact: ${phoneNumber}
Vehicle: ${vehicleId}

Please respond ASAP if you can assist.
- FixTrack Emergency System`

      return client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mechanicData.phoneNumber || "+15005550006", // Default test number
      })
    })

    await Promise.all(smsPromises)

    // Send confirmation SMS to user
    await client.messages.create({
      body: `Your emergency SOS has been sent to nearby mechanics. Someone will contact you shortly at ${phoneNumber}. Stay safe! - FixTrack`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    })

    return NextResponse.json({
      success: true,
      sosId: sosRef.id,
      message: "SOS alert sent successfully",
    })
  } catch (error) {
    console.error("SOS API Error:", error)
    return NextResponse.json({ error: "Failed to send SOS alert" }, { status: 500 })
  }
}
