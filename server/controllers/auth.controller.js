const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment');
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Name, email and password are required' });
    }

    if (!/@academy\.bt$/i.test(email)) {
      return res.status(400).json({ ok: false, error: 'Only @academy.bt emails are allowed' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    try {
      await sendVerificationEmail(user.email, code);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr.message);
      // Best-effort: still allow client to proceed to verification page
    }

    return res.status(201).json({ ok: true, message: 'Verification code sent to email', next: '/verify', email: user.email });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ ok: false, error: 'Email not verified. Please check your inbox for the verification code.' });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirect: user.role === 'admin' ? '/admin-dashboard' : '/equipment',
    });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ ok: false, error: 'Email and code are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+verificationCode +verificationCodeExpires');
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    if (user.isVerified) return res.json({ ok: true, message: 'Already verified' });

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ ok: false, error: 'No verification code. Please request a new one.' });
    }
    if (new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ ok: false, error: 'Verification code expired. Please request a new one.' });
    }
    if (String(code).trim() !== String(user.verificationCode)) {
      return res.status(400).json({ ok: false, error: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return res.json({ ok: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

exports.resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ ok: false, error: 'User already verified' });

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    user.verificationCode = code;
    user.verificationCodeExpires = expires;
    await user.save();

    try {
      await sendVerificationEmail(user.email, code);
    } catch (mailErr) {
      console.error('Failed to resend verification email:', mailErr.message);
    }

    return res.json({ ok: true, message: 'Verification code resent' });
  } catch (err) {
    next(err);
  }
};
