const router = require('express').Router();
const { register, login, verify, resendCode } = require('../controllers/auth.controller');

router.post('/register', register); // POST /api/auth/register
router.post('/login', login); // POST /api/auth/login
router.post('/verify', verify); // POST /api/auth/verify
router.post('/resend-code', resendCode); // POST /api/auth/resend-code

module.exports = router;
