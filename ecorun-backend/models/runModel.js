const { pool } = require('../src/config/db');

class RunModel {
    static async createRun(userId, data) {
        const {
            run_name,
            description,
            distance_km,
            duration_minutes,
            start_time,
            end_time,
            run_date,
            points_earned,
        } = data;

        const [result] = await pool.query(
            `INSERT INTO runs
        (user_id, run_name, description, distance_km, duration_minutes,
            start_time, end_time, run_date, points_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                run_name,
                description || null,
                distance_km,
                duration_minutes,
                start_time,
                end_time,
                run_date,
                points_earned || 0,
            ]
        );

        return result.insertId;
    }

    static async getByUser(userId) {
        const [rows] = await pool.query(
            `SELECT id, user_id, run_name, description, distance_km, duration_minutes,
                start_time, end_time, run_date, points_earned, created_at
        FROM runs
        WHERE user_id = ?
        ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }
}

module.exports = RunModel;
