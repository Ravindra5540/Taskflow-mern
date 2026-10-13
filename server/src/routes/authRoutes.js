import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

router.post('/register', async (request, response, next) => {
  const { name, email, password } = request.body ?? {};

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return response.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  }
  if (!validEmail(email) || email.length > 254) {
    return response.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return response.status(400).json({ message: 'Password must be between 8 and 72 characters.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return response.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    });

    return response.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user.id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.post('/login', async (request, response, next) => {
  const { email, password } = request.body ?? {};
  if (!validEmail(email) || typeof password !== 'string') {
    return response.status(400).json({ message: 'Enter a valid email address and password.' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }

    return response.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user.id),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
