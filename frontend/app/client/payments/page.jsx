"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { loadStripe } from "@stripe/stripe-js"

export default function PaymentsPage() {
  const { userData } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!userData?.uid) return
    fetchPayments(userData.uid)
  }, [userData])

  const fetchPayments = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payment/user/${userId}`)
      if (!response.ok) throw new Error("Failed to fetch payments")
      const data = await response.json()

      const formatted = data.map((payment) => ({
        ...payment,
        cost: Number(payment.cost),
        createdAt: payment.createdAt?._seconds ? new Date(payment.createdAt._seconds * 1000) : new Date(),
        status: payment.paymentStatus,
        description: `Service Payment`,
        vehicleInfo: payment.vehicle,
      }))

      setPayments(formatted)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load payment data.",
        variant: "destructive",
      })
    }
  }

  const stripePromise = loadStripe("pk_test_51RmGpMPqPVtwo6SC0v1Bmfi29K6pBKDKPOmR39SFgB0FbLUGnKOiuvAzpRy7nhiDpXLiQjVoH9SFnVHbfRT2D1zo00nczlHEZ0")

  const handleMakePayment = async (paymentId, amount) => {
    setLoading(paymentId)
    try {
      const response = await fetch("http://localhost:5000/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          amount: Math.round(amount * 100), // convert to cents
        }),
      })

      const data = await response.json()

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) throw new Error(error.message)
      }
    } catch (error) {
      toast({
        title: "Stripe Error",
        description: "Could not initiate payment.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const pendingPayments = payments.filter((p) => p.status === "pending")
  const completedPayments = payments.filter((p) => p.status === "paid")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage your service payments and billing history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              LKR {pendingPayments.reduce((sum, p) => sum + p.cost, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {completedPayments.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Pending Payments</CardTitle>
            <CardDescription>These payments require your immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="space-y-1">
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">{payment.vehicleInfo}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold">LKR {payment.cost.toFixed(2)}</p>
                    <Button
                      onClick={() => handleMakePayment(payment.id, payment.cost)}
                      disabled={loading === payment.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading === payment.id ? "Processing..." : "Pay Now"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your complete payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{payment.description}</p>
                  <p className="text-sm text-muted-foreground">{payment.vehicleInfo}</p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-lg font-bold">LKR {payment.cost.toFixed(2)}</p>
                  <Badge className={getStatusColor(payment.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(payment.status)}
                      <span>{payment.status}</span>
                    </span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
