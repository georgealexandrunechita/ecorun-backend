const express = require('express');
const router = express.Router();
const { pool } = require('../src/config/db');
const { body, param } = require('express-validator');
const validateRequest = require('../src/middleware/validateRequest');
const authMiddleware = require('../src/middleware/authMiddleware');


router.get('/', async (req, res) => {
    const sql = `
    SELECT *
    FROM challenges 
    WHERE active = 1 
    ORDER BY difficulty, end_date`;

    try {
        const [rows] = await pool.query(sql);
        return res.json(rows);
    } catch (err) {
        console.error('Error obteniendo challenges:', err);
        return res.status(500).json({ error: 'Error obteniendo challenges' });
    }
});


router.get(
    '/:id',
    [param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo')],
    validateRequest,
    async (req, res) => {
        const { id } = req.params;

        const sql = 'SELECT * FROM challenges WHERE id = ?';

        try {
            const [rows] = await pool.query(sql, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Challenge no encontrado' });
            }

            return res.json(rows[0]);
        } catch (err) {
            console.error('Error obteniendo challenge:', err);
            return res.status(500).json({ error: 'Error obteniendo challenge' });
        }
    }
);


router.post(
    '/:id/join',
    authMiddleware,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('id debe ser un entero positivo')
    ],
    validateRequest,
    async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        const checkSql = 'SELECT * FROM challenges WHERE id = ? AND active = 1';

        try {
            const [rows] = await pool.query(checkSql, [id]);

            if (rows.length === 0) {
                return res
                    .status(404)
                    .json({ error: 'Challenge no encontrado o inactivo' });
            }

            const sql = `
        INSERT INTO user_challenges (user_id, challenge_id, status, progress)
        VALUES (?, ?, 'in_progress', 0)`;

            const [result] = await pool.query(sql, [user_id, id]);

            return res.status(201).json({
                id: result.insertId,
                challenge_id: id,
                status: 'in_progress',
                progress: 0,
                message: 'Te has unido al challenge exitosamente'
            });
        } catch (err) {
            console.error('Error uniéndose al challenge:', err);
            return res.status(500).json({ error: 'Error uniéndose al challenge' });
        }
    }
);


router.get(
    '/user/:userId',
    authMiddleware,
    [param('userId').isInt({ min: 1 }).withMessage('userId debe ser un entero positivo')],
    validateRequest,
    async (req, res) => {
        const userId = req.user.id;

        const sql = `
    SELECT 
        uc.id,
        uc.progress,
        uc.status,
        uc.joined_at,
        c.id          AS challenge_id,
        c.name,
        c.description,
        c.goal_type,
        c.goal_value,
        c.reward_points,
        c.difficulty,
        c.category,
        c.start_date,
        c.end_date
            FROM user_challenges uc
            JOIN challenges c ON uc.challenge_id = c.id
            WHERE uc.user_id = ?
            ORDER BY uc.joined_at DESC
    `;

        try {
            const [rows] = await pool.query(sql, [userId]);
            return res.json(rows);
        } catch (err) {
            console.error('Error obteniendo challenges del usuario:', err);
            return res
                .status(500)
                .json({ error: 'Error obteniendo challenges del usuario' });
        }
    }
);

router.put(
    '/user/:userChallengeId/progress',
    authMiddleware,
    [
        param('userChallengeId')
            .isInt({ min: 1 })
            .withMessage('userChallengeId debe ser un entero positivo'),
        body('progress')
            .isFloat({ min: 0 })
            .withMessage('progress debe ser un número >= 0')
    ],
    validateRequest,
    async (req, res) => {
        const { userChallengeId } = req.params;
        const { progress } = req.body;

        const sql = `
        UPDATE user_challenges 
        SET progress = ?
        WHERE id = ?`;

        try {
            const [result] = await pool.query(sql, [progress, userChallengeId]);

            if (result.affectedRows === 0) {
                return res
                    .status(404)
                    .json({ error: 'Challenge de usuario no encontrado' });
            }

            return res.json({ message: 'Progreso actualizado', progress });
        } catch (err) {
            console.error('Error actualizando progreso:', err);
            return res.status(500).json({ error: 'Error actualizando progreso' });
        }
    }
);

module.exports = router;
