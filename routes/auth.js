const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username,
        passwordHash: password,
      },
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const accessTokenExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const refreshTokenExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
    res.json({
      accessToken: accessToken,
      accessTokenExpiresAt: accessTokenExpiration,
      refreshToken: refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiration
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refreshToken', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.sendStatus(401);
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const accessTokenExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    res.json({
      accessToken: accessToken,
      accessTokenExpiresAt: accessTokenExpiration,
    });
  });
});

module.exports = router;
