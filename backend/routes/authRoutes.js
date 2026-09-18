// /api/auth/* — see README section 7.

const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', protect, me);

module.exports = router;
