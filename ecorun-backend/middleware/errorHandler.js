class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, details = null) {
        return new AppError(message, 400, details);
    }

    static unauthorized(message = 'No autorizado') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Acceso prohibido') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Recurso no encontrado') {
        return new AppError(message, 404);
    }

    static conflict(message) {
        return new AppError(message, 409);
    }

    static internal(message = 'Error interno del servidor') {
        return new AppError(message, 500);
    }
}


const errorHandler = (err, req, res, next) => {

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details && { details: err.details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    console.error('ERROR NO OPERACIONAL:', err);

    return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        }),
    });
};


const notFound = (req, res, next) => {
    next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
};

module.exports = { AppError, errorHandler, notFound };
