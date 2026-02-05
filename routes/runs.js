const express = require('express');
const { pool: db } = require('../db');  // 👈 CORREGIDO
const router = express.Router();

// GET /api/runs
router.get('/', async (req, res) => {
    try {
        const userId = 1; // Demo
        const [runs] = await db.execute(`
      SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    `, [userId]);
        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/runs
router.post('/', async (req, res) => {
    try {
        const userId = 1;
        const { run_name, distance_km, duration_minutes } = req.body;

        const [result] = await db.execute(
            'INSERT INTO runs (user_id, run_name, distance_km, duration_minutes) VALUES (?, ?, ?, ?)',
            [userId, run_name, distance_km, duration_minutes]
        );

        res.json({ success: true, runId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

router.post('/', async (req, res) => {
    try {
        const userId = req.userId || 1;
        const {
            run_name, description, distance_km, duration_minutes,
            start_time, end_time, run_date
        } = req.body;

        const points_earned = Math.floor(distance_km * 2);

        const [result] = await db.query(`
        INSERT INTO runs (
        user_id, run_name, description, distance_km, 
        duration_minutes, start_time, end_time, run_date, points_earned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId, run_name, description || null, distance_km,
            duration_minutes, start_time, end_time, run_date, points_earned
        ]);

        res.json({
            success: true,
            message: 'Carrera creada',
            runId: result.insertId,
            points_earned
        });
    } catch (error) {
        console.error('Create run error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
