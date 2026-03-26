const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
    testConnection: jest.fn(),
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
    },
}));

const app = require('../server');
const db = require('../src/config/db');

const AUTH_TOKEN = jwt.sign({ userId: 1 }, 'test_secret');
const AUTH_HEADER = `Bearer ${AUTH_TOKEN}`;

const MOCK_CHALLENGE = {
    id: 3,
    name: 'Circuito Guadalquivir 5K',
    description: 'Completa 5km por el circuito del Guadalquivir',
    goal_type: 'distance',
    goal_value: 5,
    reward_points: 100,
    difficulty: 'easy',
    category: 'running',
    start_date: '2026-03-01',
    end_date: '2026-04-30',
    active: 1,
};

const MOCK_USER_CHALLENGE = {
    id: 1,
    progress: 0,
    status: 'in_progress',
    joined_at: '2026-03-26T10:00:00.000Z',
    challenge_id: 3,
    name: 'Circuito Guadalquivir 5K',
    description: 'Completa 5km por el circuito del Guadalquivir',
    goal_type: 'distance',
    goal_value: 5,
    reward_points: 100,
    difficulty: 'easy',
    category: 'running',
    start_date: '2026-03-01',
    end_date: '2026-04-30',
};

describe('GET /api/challenges', () => {
    it('devuelve todos los challenges activos', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_CHALLENGE]]);

        const res = await request(app).get('/api/challenges');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toMatchObject({ id: 3, name: 'Circuito Guadalquivir 5K' });
    });

    it('devuelve array vacío si no hay challenges activos', async () => {
        db.pool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/challenges');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('no requiere autenticación', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_CHALLENGE]]);

        const res = await request(app).get('/api/challenges');

        expect(res.status).toBe(200);
    });
});

describe('GET /api/challenges/:id', () => {
    it('devuelve un challenge por su ID', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_CHALLENGE]]);

        const res = await request(app).get('/api/challenges/3');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: 3,
            name: 'Circuito Guadalquivir 5K',
            difficulty: 'easy',
        });
    });

    it('devuelve 404 si el challenge no existe', async () => {
        db.pool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/challenges/99999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 si el id no es un entero positivo', async () => {
        const res = await request(app).get('/api/challenges/abc');

        expect(res.status).toBe(400);
    });

    it('no requiere autenticación', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_CHALLENGE]]);

        const res = await request(app).get('/api/challenges/3');

        expect(res.status).toBe(200);
    });
});

describe('POST /api/challenges/:id/join', () => {
    it('une al usuario autenticado a un challenge', async () => {
        db.pool.query
            .mockResolvedValueOnce([[MOCK_CHALLENGE]])     // check challenge activo
            .mockResolvedValueOnce([{ insertId: 1 }]);     // INSERT user_challenge

        const res = await request(app)
            .post('/api/challenges/3/join')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('in_progress');
        expect(res.body.progress).toBe(0);
        expect(res.body).toHaveProperty('id');
        expect(res.body.message).toMatch(/challenge/i);
    });

    it('devuelve 404 si el challenge no existe o está inactivo', async () => {
        db.pool.query.mockResolvedValueOnce([[]]); // challenge no encontrado

        const res = await request(app)
            .post('/api/challenges/99999/join')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app)
            .post('/api/challenges/3/join')
            .send({});

        expect(res.status).toBe(401);
    });

    it('devuelve 400 si el id no es un entero positivo', async () => {
        const res = await request(app)
            .post('/api/challenges/abc/join')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('GET /api/challenges/user/:userId', () => {
    it('devuelve los challenges del usuario autenticado', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_USER_CHALLENGE]]);

        const res = await request(app)
            .get('/api/challenges/user/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toMatchObject({
            challenge_id: 3,
            status: 'in_progress',
        });
    });

    it('devuelve array vacío si el usuario no tiene challenges', async () => {
        db.pool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .get('/api/challenges/user/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app).get('/api/challenges/user/1');

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/challenges/user/:userChallengeId/progress', () => {
    it('actualiza el progreso correctamente', async () => {
        db.pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .put('/api/challenges/user/1/progress')
            .set('Authorization', AUTH_HEADER)
            .send({ progress: 5.5 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.progress).toBe(5.5);
    });

    it('devuelve 404 si el user_challenge no existe', async () => {
        db.pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const res = await request(app)
            .put('/api/challenges/user/99999/progress')
            .set('Authorization', AUTH_HEADER)
            .send({ progress: 5.5 });

        expect(res.status).toBe(404);
    });

    it('devuelve 400 si progress es negativo', async () => {
        const res = await request(app)
            .put('/api/challenges/user/1/progress')
            .set('Authorization', AUTH_HEADER)
            .send({ progress: -1 });

        expect(res.status).toBe(400);
    });

    it('devuelve 400 si no se envía progress', async () => {
        const res = await request(app)
            .put('/api/challenges/user/1/progress')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(400);
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app)
            .put('/api/challenges/user/1/progress')
            .send({ progress: 5.5 });

        expect(res.status).toBe(401);
    });
});
