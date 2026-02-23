const RunService = require('../services/runServices');

class RunController {
    static async createRun(req, res, next) {
        try {
            const runData = req.body;
            const newRun = await RunService.createRun(runData);

            res.status(201).json({
                success: true,
                message: 'Run creado exitosamente',
                data: newRun
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUserRuns(req, res, next) {
        try {
            const { userId } = req.params;
            const runs = await RunService.getUserRuns(userId);

            res.status(200).json({
                success: true,
                data: runs
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRun(req, res, next) {
        try {
            const { id } = req.params;
            const run = await RunService.getRunById(id);

            res.status(200).json({
                success: true,
                data: run
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateRun(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedRun = await RunService.updateRun(id, updateData);

            res.status(200).json({
                success: true,
                message: 'Run actualizado exitosamente',
                data: updatedRun
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteRun(req, res, next) {
        try {
            const { id } = req.params;
            await RunService.deleteRun(id);

            res.status(200).json({
                success: true,
                message: 'Run eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = RunController;
