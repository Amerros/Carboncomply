const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/create-subscription', authenticateToken, async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user.userId;

        const db = getDb();
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create or get Stripe customer
        let customerId = user.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.company_name,
            });
            customerId = customer.id;
            
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
                    [customerId, userId],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        }

        // For demo - replace with your actual Stripe price IDs
        const priceIds = {
            starter: 'price_1234_starter', // Replace with real Stripe price ID
            professional: 'price_1234_professional' // Replace with real Stripe price ID
        };

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card', 'ideal'],
            line_items: [{
                price: priceIds[plan],
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
                userId: userId.toString(),
                plan: plan
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

router.post('/create-payment', authenticateToken, async (req, res) => {
    try {
        const { amount, description } = req.body;
        const userId = req.user.userId;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            description: description,
            metadata: {
                userId: userId.toString(),
                type: 'one-time-report'
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

module.exports = router;
