const challengeService = require('../services/challengeServices');

class ChallengeController {
    static async getActiveChallenges(req, res, next) {
        try {
            const challenges = await ChallengeService.getActiveChallenges();
            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            next(error);
        }
    }

    static async getChallenge(req, res, next) {
        try {
            const { id } = req.params;
            const challenge = await ChallengeService.getChallengeById(id);
            res.json({
                success: true,
                data: challenge
            });
        } catch (error) {
            next(error);
        }
    }

    static async joinChallenge(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const result = await ChallengeService.joinChallenge(userId, id);
            
            res.status(201).json({
                success: true,
                message: 'Te has unido al challenge exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUserChallenges(req, res, next) {
        try {
            const userId = req.user.id;
            const challenges = await ChallengeService.getUserChallenges(userId);
            
            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateProgress(req, res, next) {
        try {
            const { userChallengeId } = req.params;
            const { progress } = req.body;
            const updated = await ChallengeService.updateProgress(userChallengeId, progress);
            
            res.json({
                success: true,
                message: 'Progreso actualizado',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChallengeController;
