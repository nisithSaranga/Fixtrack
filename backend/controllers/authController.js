const { db, admin } = require('../config/firebaseConfig');
const axios = require('axios');

const register = async (req, res) => {
  const { email, password, name, phone, role } = req.body;
  
  // Restrict admin role creation
  if (role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot be created via signup' });
  }

  if (!['client', 'garage'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be client or garage' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      phone,
      role: role || 'client',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const apiKey = process.env.FIREBASE_API_KEY;
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, localId: uid } = response.data;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const userData = userDoc.data();
    const customToken = await admin.auth().createCustomToken(uid);

    res.status(200).json({
      message: 'Login successful',
      uid,
      token: customToken,
      user: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    res.status(401).json({
      message: 'Invalid email or password',
      error: error.response ? error.response.data.error.message : error.message,
    });
  }
};

const googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'ID token is required' });
  }

  try {
    // Verify Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || 'Google User';

    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      // Create a new client account in Firestore
      await db.collection('users').doc(uid).set({
        email,
        name,
        phone: decodedToken.phone_number || '',
        role: 'client',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Ensure the user is a client
      const userData = userDoc.data();
      if (userData.role !== 'client') {
        return res.status(403).json({ message: 'Google sign-in is only allowed for client accounts' });
      }
    }

    // Generate custom token
    const customToken = await admin.auth().createCustomToken(uid);
    const userData = (await db.collection('users').doc(uid).get()).data();

    res.status(200).json({
      message: 'Google sign-in successful',
      uid,
      token: customToken,
      user: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(401).json({ message: 'Google sign-in failed', error: error.message });
  }
};

const getUserById = async (req, res) => {
  const { uid } = req.params;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { register, login, googleSignIn, getUserById };