const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: 'Token inválido' });
    }
}

module.exports = authMiddleware;
