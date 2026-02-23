const authService = require('../services/authServices');

class AuthController {
    static async register(req, res, next) {
        try {
            const { username, email, password } = req.body;

            const user = await AuthService.register(username, email, password);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente',
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const { user, token } = await AuthService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: { user, token },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
