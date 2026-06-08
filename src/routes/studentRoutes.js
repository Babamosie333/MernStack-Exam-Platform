const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const router = express.Router();

function signStudentToken(student) {
  return jwt.sign(
    { id: student._id, phone: student.phone, name: student.name, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedPhone = String(phone).trim();
    const existing = await Student.findOne({ phone: normalizedPhone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const student = await Student.create({
      name: String(name).trim(),
      phone: normalizedPhone,
      passwordHash,
    });

    const token = signStudentToken(student);
    res.status(201).json({
      message: 'Registration successful',
      token,
      student: { id: student._id, name: student.name, phone: student.phone },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const student = await Student.findOne({ phone: String(phone).trim() });
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(String(password), student.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signStudentToken(student);
    res.json({
      message: 'Login successful',
      token,
      student: { id: student._id, name: student.name, phone: student.phone },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
