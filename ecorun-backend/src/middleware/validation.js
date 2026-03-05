const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(AppError.badRequest('Datos inválidos', errors.array()));
    }
    next();
};

const registerValidation = [
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
        .withMessage('Password debe tener al menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password debe contener mayúscula, minúscula y número'),
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('password')
        .notEmpty()
        .withMessage('Password es requerido'),
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
};
