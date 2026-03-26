const request = require('supertest');
const bcryptjs = require('bcryptjs');

jest.mock('../src/config/db', () => ({
    testConnection: jest.fn(),
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
    },
}));

const app = require('../server');
const db = require('../src/config/db');

// Hash generado una sola vez para todos los tests de login
const TEST_PASSWORD = 'Test123';
const TEST_PASSWORD_HASH = bcryptjs.hashSync(TEST_PASSWORD, 1);

const MOCK_USER = {
    id: 1,
    username: 'testuser',
    email: 'testuser@ecorun.com',
    password_hash: TEST_PASSWORD_HASH,
};

describe('POST /api/auth/register', () => {
    it('registra un nuevo usuario y devuelve token', async () => {
        db.pool.execute.mockResolvedValueOnce([{ insertId: 1 }]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'testuser@ecorun.com', password: TEST_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.token).toBeTruthy();
        expect(res.body.user).toMatchObject({
            id: 1,
            username: 'testuser',
            email: 'testuser@ecorun.com',
        });
    });

    it('no expone la contraseña en la respuesta', async () => {
        db.pool.execute.mockResolvedValueOnce([{ insertId: 1 }]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'testuser@ecorun.com', password: TEST_PASSWORD });

        expect(res.body.user).not.toHaveProperty('password_hash');
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('devuelve 400 si falta el email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', password: TEST_PASSWORD });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('devuelve 400 si el password tiene menos de 6 caracteres', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'testuser@ecorun.com', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('devuelve 400 si el email no es válido', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'no-es-un-email', password: TEST_PASSWORD });

        expect(res.status).toBe(400);
    });

    it('devuelve 400 si el usuario ya existe (ER_DUP_ENTRY)', async () => {
        const dupError = new Error("Duplicate entry 'testuser@ecorun.com' for key 'email'");
        dupError.code = 'ER_DUP_ENTRY';
        db.pool.execute.mockRejectedValueOnce(dupError);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'testuser@ecorun.com', password: TEST_PASSWORD });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});

describe('POST /api/auth/login', () => {
    it('hace login correctamente y devuelve token', async () => {
        db.pool.execute.mockResolvedValueOnce([[MOCK_USER]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: MOCK_USER.email, password: TEST_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.token).toBeTruthy();
        expect(res.body.user).toMatchObject({
            id: 1,
            username: 'testuser',
            email: 'testuser@ecorun.com',
        });
    });

    it('no expone password_hash en la respuesta', async () => {
        db.pool.execute.mockResolvedValueOnce([[MOCK_USER]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: MOCK_USER.email, password: TEST_PASSWORD });

        expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('devuelve 401 con contraseña incorrecta', async () => {
        db.pool.execute.mockResolvedValueOnce([[MOCK_USER]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: MOCK_USER.email, password: 'WrongPass999' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 401 si el usuario no existe', async () => {
        db.pool.execute.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@ecorun.com', password: TEST_PASSWORD });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('devuelve 401 si no se envía body', async () => {
        db.pool.execute.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(401);
    });
});
