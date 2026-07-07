const express = require("express")
const router = express.Router()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { updatePaymentStatusFunction } = require("../controllers/paymentController")

// Create a checkout session — payment stays "pending" until verified
router.post("/create-checkout-session", async (req, res) => {
  const { paymentId, amount } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `Payment for service #${paymentId}`,
            },
            unit_amount: amount, // smallest currency unit
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { paymentId }, // so we can identify the payment when verifying
      success_url: `http://localhost:3000/client/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/client/payment-cancel`,
    })

    res.json({ sessionId: session.id })
  } catch (err) {
    console.error("Stripe error:", err)
    res.status(500).json({ error: "Failed to create Stripe session" })
  }
})

// Verify a completed checkout — called by the payment-success page.
// Status is only marked "paid" after Stripe confirms the session was paid.
router.get("/verify-payment/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)

    if (session.payment_status === "paid") {
      await updatePaymentStatusFunction(session.metadata.paymentId, "paid")
      return res.json({ verified: true, paymentId: session.metadata.paymentId })
    }

    res.json({ verified: false, status: session.payment_status })
  } catch (err) {
    console.error("Stripe verify error:", err)
    res.status(500).json({ error: "Failed to verify payment" })
  }
})

module.exports = router