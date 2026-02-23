const express = require('express');
const { param, body } = require('express-validator');
const RunController = require('../controllers/runController');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post(
    '/',
    [
        body('user_id').isInt({ min: 1 }).withMessage('user_id requerido'),
        body('run_name').trim().notEmpty().isLength({ max: 100 }),
        body('distance_km').isFloat({ gt: 0 }),
        body('duration_minutes').isInt({ min: 1 }),
        body('start_time').isISO8601(),
        body('end_time').isISO8601(),
        body('run_date').isISO8601()
    ],
    validateRequest,
    RunController.createRun
);

router.get('/user/:userId', 
    [param('userId').isInt({ min: 1 })],
    validateRequest,
    RunController.getUserRuns
);

router.get('/:id',
    [param('id').isInt({ min: 1 })],
    validateRequest,
    RunController.getRun
);

router.put('/:id',
    [param('id').isInt({ min: 1 })],
    validateRequest,
    RunController.updateRun
);

router.delete('/:id',
    [param('id').isInt({ min: 1 })],
    validateRequest,
    RunController.deleteRun
);

module.exports = router;
