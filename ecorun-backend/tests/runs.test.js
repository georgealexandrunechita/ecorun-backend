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

// Token válido para todos los tests protegidos
const AUTH_TOKEN = jwt.sign({ userId: 1 }, 'test_secret');
const AUTH_HEADER = `Bearer ${AUTH_TOKEN}`;

const MOCK_RUN = {
    id: 1,
    user_id: 1,
    run_name: 'Carrera Test Sevilla',
    description: 'Test',
    distance_km: 5,
    duration_minutes: 30,
    start_time: '2026-03-26T08:00:00.000Z',
    end_time: '2026-03-26T08:30:00.000Z',
    run_date: '2026-03-26',
    points_earned: 50,
    created_at: '2026-03-26T10:00:00.000Z',
};

const RUN_BODY = {
    user_id: 1,
    run_name: 'Carrera Test Sevilla',
    description: 'Test',
    distance_km: 5,
    duration_minutes: 30,
    start_time: '2026-03-26T08:00:00.000Z',
    end_time: '2026-03-26T08:30:00.000Z',
    run_date: '2026-03-26',
};

describe('POST /api/runs', () => {
    it('crea una carrera correctamente', async () => {
        db.pool.query
            .mockResolvedValueOnce([{ insertId: 1 }])       // INSERT
            .mockResolvedValueOnce([[MOCK_RUN]]);             // SELECT tras insertar

        const res = await request(app)
            .post('/api/runs')
            .set('Authorization', AUTH_HEADER)
            .send(RUN_BODY);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            id: 1,
            run_name: 'Carrera Test Sevilla',
            distance_km: 5,
            points_earned: 50,
        });
    });

    it('devuelve 401 sin token de autenticación', async () => {
        const res = await request(app)
            .post('/api/runs')
            .send(RUN_BODY);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 401 con token inválido', async () => {
        const res = await request(app)
            .post('/api/runs')
            .set('Authorization', 'Bearer token.invalido.xyz')
            .send(RUN_BODY);

        expect(res.status).toBe(401);
    });

    it('devuelve 400 si falta user_id', async () => {
        const res = await request(app)
            .post('/api/runs')
            .set('Authorization', AUTH_HEADER)
            .send({ ...RUN_BODY, user_id: undefined });

        expect(res.status).toBe(400);
    });

    it('devuelve 400 si distance_km es 0 o negativo', async () => {
        const res = await request(app)
            .post('/api/runs')
            .set('Authorization', AUTH_HEADER)
            .send({ ...RUN_BODY, distance_km: -1 });

        expect(res.status).toBe(400);
    });

    it('devuelve 400 si start_time no es ISO8601', async () => {
        const res = await request(app)
            .post('/api/runs')
            .set('Authorization', AUTH_HEADER)
            .send({ ...RUN_BODY, start_time: 'no-es-fecha' });

        expect(res.status).toBe(400);
    });
});

describe('GET /api/runs/user/:userId', () => {
    it('devuelve las carreras del usuario', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_RUN]]);

        const res = await request(app)
            .get('/api/runs/user/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toMatchObject({ id: 1, run_name: 'Carrera Test Sevilla' });
    });

    it('devuelve array vacío si el usuario no tiene carreras', async () => {
        db.pool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .get('/api/runs/user/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app).get('/api/runs/user/1');

        expect(res.status).toBe(401);
    });
});

describe('GET /api/runs/:id', () => {
    it('devuelve una carrera por su ID', async () => {
        db.pool.query.mockResolvedValueOnce([[MOCK_RUN]]);

        const res = await request(app)
            .get('/api/runs/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(1);
    });

    it('devuelve 404 si la carrera no existe', async () => {
        db.pool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .get('/api/runs/99999')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(404);
    });

    it('devuelve 400 si el id no es un entero', async () => {
        const res = await request(app)
            .get('/api/runs/abc')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(400);
    });
});

describe('PUT /api/runs/:id', () => {
    it('actualiza una carrera correctamente', async () => {
        const updatedRun = { ...MOCK_RUN, run_name: 'Carrera Actualizada', distance_km: 8.5 };

        db.pool.query
            .mockResolvedValueOnce([{ affectedRows: 1 }])    // UPDATE
            .mockResolvedValueOnce([[updatedRun]]);            // SELECT en getRunById

        const res = await request(app)
            .put('/api/runs/1')
            .set('Authorization', AUTH_HEADER)
            .send({ run_name: 'Carrera Actualizada', distance_km: 8.5 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.run_name).toBe('Carrera Actualizada');
    });

    it('devuelve 404 si la carrera no existe', async () => {
        db.pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const res = await request(app)
            .put('/api/runs/99999')
            .set('Authorization', AUTH_HEADER)
            .send({ run_name: 'Test' });

        expect(res.status).toBe(404);
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app)
            .put('/api/runs/1')
            .send({ run_name: 'Test' });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/runs/:id', () => {
    it('elimina una carrera correctamente', async () => {
        db.pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .delete('/api/runs/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/eliminado/i);
    });

    it('devuelve 404 si la carrera no existe', async () => {
        db.pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const res = await request(app)
            .delete('/api/runs/99999')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(404);
    });

    it('devuelve 401 sin autenticación', async () => {
        const res = await request(app).delete('/api/runs/1');

        expect(res.status).toBe(401);
    });
});
