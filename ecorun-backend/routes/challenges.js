const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/', (req, res) => {
    const sql = `
    SELECT * FROM challenges 
    WHERE active = 1 
    ORDER BY difficulty, end_date`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error obteniendo challenges' });
        }
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'SELECT * FROM challenges WHERE id = ?';

    db.query(sql, [id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error obteniendo challenge' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Challenge no encontrado' });
        }

        res.json(rows[0]);
    });
});


router.post('/:id/join', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id requerido' });
    }


    const checkSql = 'SELECT * FROM challenges WHERE id = ? AND active = 1';

    db.query(checkSql, [id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error verificando challenge' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Challenge no encontrado o inactivo' });
        }

        const sql = `
        INSERT INTO user_challenges (user_id, challenge_id, status, progress)
        VALUES (?, ?, 'in_progress', 0)`;

        db.query(sql, [user_id, id], (err, result) => {
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Ya estás en este challenge' });
                }
                return res.status(500).json({ error: 'Error uniéndose al challenge' });
            }
            res.status(201).json({
                id: result.insertId,
                challenge_id: id,
                status: 'in_progress',
                message: 'Te has unido al challenge exitosamente'
            });
        });
    });
});


router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;

    const sql = `
    SELECT 
        uc.id,
        uc.progress,
        uc.status,
        uc.joined_at,
        c.id as challenge_id,
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
    ORDER BY uc.joined_at DESC`;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error obteniendo challenges del usuario' });
        }
        res.json(rows);
    });
});


router.put('/user/:userChallengeId/progress', (req, res) => {
    const { userChallengeId } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
        return res.status(400).json({ error: 'progress requerido' });
    }

    const sql = `
    UPDATE user_challenges 
    SET progress = ?
    WHERE id = ?`;

    db.query(sql, [progress, userChallengeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error actualizando progreso' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Challenge de usuario no encontrado' });
        }

        res.json({ message: 'Progreso actualizado', progress });
    });
});

module.exports = router;
