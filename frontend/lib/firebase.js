import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCPM-dPqnU81Dj6hTrx7WDzfCPkSfoFOpw",
  authDomain: "fix-track.firebaseapp.com",
  projectId: "fix-track",
  storageBucket: "fix-track.appspot.com",
  messagingSenderId: "949198846918",
  appId: "1:949198846918:web:adf4301520b9028a5c10c7",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
