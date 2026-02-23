const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class ChallengeService {
    static async getActiveChallenges() {
        const [challenges] = await db.query(`
            SELECT * FROM challenges 
            WHERE active = 1 
            ORDER BY difficulty, end_date
        `);
        return challenges;
    }

    static async getChallengeById(id) {
        const [challenges] = await db.query('SELECT * FROM challenges WHERE id = ?', [id]);
        if (challenges.length === 0) {
            throw AppError.notFound('Challenge no encontrado');
        }
        return challenges[0];
    }

    static async joinChallenge(userId, challengeId) {
        const challenge = await this.getChallengeById(challengeId);

        const [result] = await db.query(`
            INSERT INTO user_challenges (user_id, challenge_id, status, progress)
            VALUES (?, ?, 'in_progress', 0)
        `, [userId, challengeId]);

        return {
            id: result.insertId,
            challenge_id: challengeId,
            status: 'in_progress',
            progress: 0,
            challenge: challenge
        };
    }

    static async getUserChallenges(userId) {
        const [userChallenges] = await db.query(`
            SELECT 
                uc.id, uc.progress, uc.status, uc.joined_at,
                c.id AS challenge_id, c.name, c.description, c.goal_type, 
                c.goal_value, c.reward_points, c.difficulty, c.category,
                c.start_date, c.end_date
            FROM user_challenges uc
            JOIN challenges c ON uc.challenge_id = c.id
            WHERE uc.user_id = ?
            ORDER BY uc.joined_at DESC
        `, [userId]);
        return userChallenges;
    }

    static async updateProgress(userChallengeId, progress) {
        const [result] = await db.query(`
            UPDATE user_challenges SET progress = ? WHERE id = ?
        `, [progress, userChallengeId]);

        if (result.affectedRows === 0) {
            throw AppError.notFound('Progreso de challenge no encontrado');
        }
        const [updated] = await db.query(`
            SELECT progress, status FROM user_challenges WHERE id = ?
        `, [userChallengeId]);

        return updated[0];
    }
}

module.exports = ChallengeService;
