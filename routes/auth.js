const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/connection');
const { sendWelcomeEmail } = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName } = req.body;
        
        if (!email || !password || !companyName) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const db = getDb();
        
        // Check if user exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Insert user
        const userId = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (email, password, company_name) VALUES (?, ?, ?)',
                [email, hashedPassword, companyName],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        // Generate JWT
        const token = jwt.sign(
            { userId, email, plan: 'free' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send welcome email
        await sendWelcomeEmail(email, companyName);

        res.json({
            success: true,
            token,
            user: { id: userId, email, companyName, plan: 'free' }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const db = getDb();
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, plan: user.plan },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                companyName: user.company_name,
                plan: user.plan
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
