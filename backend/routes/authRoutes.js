const express = require('express');
const { register, login, googleSignIn, getUserById } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-signin', googleSignIn);
router.get('/:uid', getUserById);

module.exports = router;