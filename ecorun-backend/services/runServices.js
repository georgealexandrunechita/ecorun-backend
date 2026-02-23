const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class RunService {
    static async createRun(runData) {
        const {
            user_id, run_name, description, distance_km, duration_minutes,
            start_time, end_time, run_date, points_earned
        } = runData;

        const calculatedPoints = points_earned || Math.round(distance_km * 10);

        const [result] = await db.query(`
            INSERT INTO runs (user_id, run_name, description, distance_km, 
                            duration_minutes, start_time, end_time, run_date, points_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [user_id, run_name, description || null, distance_km, duration_minutes,
            start_time, end_time, run_date, calculatedPoints]);

        const [createdRun] = await db.query(`
            SELECT * FROM runs WHERE id = ?
        `, [result.insertId]);

        return createdRun[0];
    }

    static async getUserRuns(userId) {
        const [runs] = await db.query(`
            SELECT * FROM runs WHERE user_id = ?
            ORDER BY run_date DESC, id DESC
        `, [userId]);
        return runs;
    }

    static async getRunById(id) {
        const [runs] = await db.query(`
            SELECT * FROM runs WHERE id = ?
        `, [id]);

        if (runs.length === 0) {
            throw AppError.notFound('Run no encontrado');
        }
        return runs[0];
    }

    static async updateRun(id, updateData) {
        const fields = [];
        const values = [];
        let paramsIndex = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                fields.push(`${key} = ?`);
                values.push(value);
                paramsIndex++;
            }
        });

        if (fields.length === 0) {
            throw AppError.badRequest('No hay datos para actualizar');
        }

        values.push(id);

        const [result] = await db.query(`
            UPDATE runs SET ${fields.join(', ')} WHERE id = ?
        `, values);

        if (result.affectedRows === 0) {
            throw AppError.notFound('Run no encontrado');
        }

        return this.getRunById(id);
    }

    static async deleteRun(id) {
        const [result] = await db.query('DELETE FROM runs WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            throw AppError.notFound('Run no encontrado');
        }
        return { message: 'Run eliminado correctamente' };
    }
}

module.exports = RunService;
