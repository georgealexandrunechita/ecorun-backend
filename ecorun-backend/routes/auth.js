const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');


router.post('/register',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username debe tener entre 3 y 50 caracteres')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username solo puede contener letras, números y guiones bajos'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password debe tener mínimo 6 caracteres')
    ],
    validateRequest,
    async (req, res) => {
        const { username, email, password } = req.body;

        try {
            const passwordHash = await bcrypt.hash(password, 10);

            const sql = `
        INSERT INTO users (username, email, password_hash, role, eco_points)
        VALUES (?, ?, ?, 'user', 0)`;

            db.query(sql, [username, email, passwordHash], (err, result) => {
                if (err) {
                    console.error(err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Username o email ya existen' });
                    }
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }

                res.status(201).json({
                    id: result.insertId,
                    username,
                    email,
                    message: 'Usuario registrado exitosamente'
                });
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);


router.post('/login',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email inválido'),
        body('password')
            .notEmpty()
            .withMessage('Password requerido')
    ],
    validateRequest,
    (req, res) => {
        const { email, password } = req.body;

        const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';

        db.query(sql, [email], async (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error en la base de datos' });
            }

            if (rows.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const user = rows[0];

            try {
                const passwordMatch = await bcrypt.compare(password, user.password_hash);

                if (!passwordMatch) {
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }

                const { password_hash, ...userWithoutPassword } = user;

                res.json({
                    message: 'Login exitoso',
                    user: userWithoutPassword
                });
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
    }
);


router.get('/user/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'SELECT id, username, email, eco_points, role, created_at FROM users WHERE id = ?';

    db.query(sql, [id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    });
});

module.exports = router;
