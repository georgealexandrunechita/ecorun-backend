
const { pool } = require('../src/config/db');

class UserModel {
    static async create({ username, email, passwordHash }) {
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, eco_points, role) VALUES (?, ?, ?, 0, "user")',
            [username, email, passwordHash]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, username, email, eco_points, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT id, username, email, password_hash, eco_points, role FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }
}

module.exports = UserModel;
