const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_aqui';
const JWT_EXPIRES_IN = '24h';

class AuthService {
    static async register(username, email, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const [result] = await db.query(
                'INSERT INTO users (username, email, password_hash, eco_points, role) VALUES (?, ?, ?, 0, "user")',
                [username, email, hashedPassword]
            );

            const [users] = await db.query(
                'SELECT id, username, email, eco_points, role, created_at FROM users WHERE id = ?',
                [result.insertId]
            );

            return users[0];
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('email')) {
                    throw AppError.conflict('El email ya está registrado');
                }
                if (error.message.includes('username')) {
                    throw AppError.conflict('El username ya está en uso');
                }
            }
            throw error;
        }
    }

    static async login(email, password) {
        const [users] = await db.query(
            'SELECT id, username, email, password_hash, eco_points, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            throw AppError.unauthorized('Credenciales inválidas');
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            throw AppError.unauthorized('Credenciales inválidas');
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password_hash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw AppError.unauthorized('Token inválido o expirado');
        }
    }
}

module.exports = AuthService;
