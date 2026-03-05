const { pool } = require('../src/config/db');

class ChallengeModel {
    static async getAllActive() {
        const [rows] = await pool.query(
            `SELECT id, name, description, goal_type, goal_value, start_date, end_date,
                reward_points, difficulty, category, active
            FROM challenges
            WHERE active = TRUE
            ORDER BY start_date ASC`
        );
        return rows;
    }
}

module.exports = ChallengeModel;
