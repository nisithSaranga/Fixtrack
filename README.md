<div align="center">

# 🚗 FixTrack - Vehicle Breakdown & Service Management Platform

**Report a breakdown, get matched with a nearby garage, track the repair, and pay online - all in one platform.**

*A full-stack application with real-time service tracking, SOS emergency alerts, and secure online payments.*

</div>

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🆘 | **SOS Emergency Alerts** | One-tap distress signal with live location - nearby garages are notified instantly via **Twilio SMS** |
| 📍 | **Geolocation Matching** | Breakdown requests are matched to the closest available garage using location-based lookup |
| 🔧 | **Service Tracking** | Customers follow their repair status in real time through **Firebase Firestore** live sync |
| 💳 | **Stripe Payments** | Secure card checkout with **server-verified payment status** - a payment is only marked paid after Stripe confirms the session |
| 👥 | **Role-Based Access** | Three separate portals - **Client**, **Garage/Mechanic**, and **Admin** - each with its own dashboard and permissions |
| 🔐 | **Firebase Auth** | Email/password and **Google Sign-In**, with role enforcement on the server (admin accounts can't be self-registered) |
| 🚙 | **Vehicle Management** | Clients register and manage their vehicles; garages see assigned vehicles and service requests |
| 🛡️ | **Protected APIs** | Express middleware verifies Firebase ID tokens before any protected route is reached |

---

## 🛠️ Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js (App Router) · React · Tailwind CSS · shadcn/ui |
| **Backend** | Node.js · Express |
| **Database & Auth** | Firebase - Firestore (real-time) + Authentication |
| **Integrations** | Stripe (payments) · Twilio (SMS) · Geolocation API |

---

## 🏗️ How it's put together

```
┌──────────────────────┐         ┌──────────────────────────┐
│   Next.js frontend    │  HTTPS  │      Express API          │
│   (localhost:3000)    │ ──────> │   (localhost:5000)        │
│                       │ <────── │                           │
│  • Client portal      │  JSON   │  • Auth (token verify)    │
│  • Garage portal      │         │  • Services & vehicles    │
│  • Admin portal       │         │  • Stripe sessions +      │
│  • Firestore live     │         │    payment verification   │
│    sync (read)        │         │  • Twilio SOS dispatch    │
└──────────┬────────────┘         └────────────┬──────────────┘
           │                                   │
           ▼                                   ▼
     ┌─────────────────────────────────────────────┐
     │        Firebase - Auth + Firestore           │
     └─────────────────────────────────────────────┘
```

**A few deliberate choices:**

- **Payments are verified server-side.** Creating a checkout session never marks anything as paid - the success page triggers a backend call that asks Stripe directly whether the session completed. The client can't fake a payment by visiting a URL.
- **Roles are enforced on the server, not the UI.** Signup rejects admin role creation, and Google Sign-In is restricted to client accounts - checked in the API, not just hidden in the interface.
- **Secrets live in environment variables.** No keys in code; `.env.example` files document exactly what each side needs.

---

## 🚀 Run it locally

**Prerequisites:** Node.js 20+ · a [Firebase](https://console.firebase.google.com) project (Firestore + Auth enabled) · [Stripe](https://stripe.com) test keys · a [Twilio](https://twilio.com) account (optional - only for SOS SMS)

```bash
# 1. Clone
git clone https://github.com/nisithSaranga/Fixtrack.git
cd Fixtrack

# 2. Backend (terminal 1)
cd backend
npm install
cp .env.example .env            # fill in your values
# place your Firebase service account file at: config/serviceAccountKey.json
npm start                       # API -> http://localhost:5000

# 3. Frontend (terminal 2)
cd frontend
npm install
cp .env.example .env.local      # fill in your values
npm run dev                     # site -> http://localhost:3000
```

**`backend/.env`**
```env
PORT=5000
FIREBASE_API_KEY=            # Firebase web API key (for password sign-in)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
STRIPE_SECRET_KEY=           # sk_test_...
```

**`frontend/.env.local`**
```env
STRIPE_SECRET_KEY=           # sk_test_...
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=       # from your service account JSON
FIREBASE_PRIVATE_KEY=        # from your service account JSON (keep the quotes and \n)
```

Test payments with Stripe's test card: `4242 4242 4242 4242` - any future date, any CVC.

---

<div align="center">

Built by **Nisith Saranga** · © 2026

*FixTrack is a portfolio project. Stripe runs in test mode - no real payments are processed.*

</div>
