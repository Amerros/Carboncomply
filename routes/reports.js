const express = require('express');
const { getDb } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/save-calculation', authenticateToken, (req, res) => {
    const { calculationData, results } = req.body;
    const userId = req.user.userId;

    const db = getDb();
    db.run(
        'INSERT INTO calculations (user_id, calculation_data, results) VALUES (?, ?, ?)',
        [userId, JSON.stringify(calculationData), JSON.stringify(results)],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save calculation' });
            }

            res.json({ success: true, calculationId: this.lastID });
        }
    );
});

router.get('/calculations', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const db = getDb();

    db.all(
        'SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, calculations) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch calculations' });
            }

            const formattedCalculations = calculations.map(calc => ({
                id: calc.id,
                calculationData: JSON.parse(calc.calculation_data),
                results: JSON.parse(calc.results),
                createdAt: calc.created_at
            }));

            res.json(formattedCalculations);
        }
    );
});

module.exports = router;
